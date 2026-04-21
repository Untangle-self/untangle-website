/**
 * useFlowController
 *
 * Single source of truth for flow progression.
 * The SYSTEM controls all transitions — the LLM only generates text.
 *
 * FLOW (strict, enforced by assertTransition):
 *
 *   start → input → reflection → deepening_1 → alignment_choice
 *     'yeah… that fits'  → deepening_2 → untangle
 *     'parts of it'      → input (clarificationMode) → deepening_2 → untangle
 *     'I don't know'     → input (clarificationMode) → deepening_2 → untangle
 *
 *   untangle → post_untangle
 *     'Understand' / 'Act' / 'Hold' → mini_untangle_* → decision_layer (chips)
 *     decision_layer: sit with this → deepening_2; do something small → mini_untangle_act; leave it here → closure view
 */
import { useCallback } from 'react';
import { useConversationStore } from '../store/conversationStore';
import { callLLM } from '../services/llmService';
import { assertTransition, VALID_TRANSITIONS } from '../types/flow';
import type { FlowState } from '../types/flow';

// ── Alignment option generation ──────────────────────────────────────────────

async function generateAlignmentOptions(
  userInput: string,
  reflection: string,
  deepening: string,
): Promise<{ option1: string; option2: string }> {
  const res = await fetch('/api/alignment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userInput, reflection, deepening }),
  });
  if (!res.ok) throw new Error('Alignment generation failed');
  return res.json();
}

// ── System-defined chips ─────────────────────────────────────────────────────

const POST_UNTANGLE_CHIPS = [

  { id: 'p1', label: 'understand this feeling a bit more' },
  { id: 'p2', label: 'what can I do here' },
  { id: 'p3', label: "I don't know" },

];

const DECISION_CHIPS = [

  { id: 'dc1', label: 'sit with this' },
  { id: 'dc2', label: 'do something small' },
  { id: 'dc3', label: 'leave it here' },

];

// ── Transition helper ────────────────────────────────────────────────────────

const isProcessingRef = { current: false };

function transition(to: FlowState): void {
  const { currentStep, setStep } = useConversationStore.getState();
  const allowed = VALID_TRANSITIONS[currentStep];
  if (!allowed.includes(to)) {
    console.warn(`[FlowController] Blocked invalid transition: ${currentStep} → ${to}`);
    return;
  }
  assertTransition(currentStep, to);
  setStep(to);

  if (to === 'deepening_1' && !isProcessingRef.current) {
    isProcessingRef.current = true;
    runDeepening1().finally(() => {
      isProcessingRef.current = false;
    });
  }
  if (to === 'mini_untangle_understand') runMiniUntangle();
  if (to === 'mini_untangle_act') runMiniUntangle();
  if (to === 'mini_untangle_hold') runMiniUntangle();
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function sanitizeMiniUntangle(
  miniUntangle: unknown,
  deepening: unknown,
  deepening2: unknown,
  untangle: unknown,
): string {
  if (typeof miniUntangle !== 'string') return '';
  const mini = miniUntangle.trim();
  if (!mini) return '';

  const lineCount = mini.split('\n').filter((line) => line.trim().length > 0).length;
  if (lineCount < 1 || lineCount > 2) return '';

  const normalizedMini = mini.replace(/\s+/g, ' ').toLowerCase();
  const candidates = [deepening, deepening2, untangle]
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim().replace(/\s+/g, ' ').toLowerCase());

  if (candidates.includes(normalizedMini)) return '';
  return mini;
}

// ── Sequences ────────────────────────────────────────────────────────────────

async function runDeepening2ThenUntangle() {

  const { llmDeepening2, llmUntangle } = useConversationStore.getState();

  const s = useConversationStore.getState();

  useConversationStore.getState().setTyping(true);

  await delay(1200);

  await delay(1200);

  s.addMessage({ role: 'app', text: llmDeepening2 });

  useConversationStore.getState().setTyping(false);

  await delay(2000);

  const s2 = useConversationStore.getState();

  if (s2.currentStep !== 'deepening_2') return;

  if (llmUntangle) {

    s2.setUntangleReveal(llmUntangle);

    transition('untangle');

  }
}

async function runDeepening1() {

  const s = useConversationStore.getState();

  s.setTyping(true);

  await delay(1200);

  s.addMessage({

    role: 'app',

    text: s.llmDeepening,

    chips: [
      { id: 'd1', label: 'yeah… that fits' },
      { id: 'd2', label: 'parts of it' },
      { id: 'd3', label: 'something else' },
    ],
  });

  s.setTyping(false);

}

async function runMiniUntangle() {

  const s = useConversationStore.getState();
  s.setTyping(true);
  await delay(1200);
  if (s.llmMiniUntangle) {

    s.addMessage({

      role: 'app',

      text: s.llmMiniUntangle,

      type: 'chat',

    });

  }
  s.setTyping(false);

  await delay(800);

  s.addMessage({

    role: 'app',

    text: 'What feels right from here?',

    chips: DECISION_CHIPS,

  });

  transition('decision_layer');
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useFlowController() {

  const handleUserInput = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const state = useConversationStore.getState();
    state.addMessage({ role: 'user', text });

    if (state.clarificationMode) {
      state.setClarificationMode(false);

      const cs = useConversationStore.getState();

      const originalInput = cs.messages.find(m => m.role === 'user')?.text ?? text;

      const res: any = await callLLM({

        userInput: originalInput,

        reflection: state.llmReflection,

        currentInput: text,

      });

      if (res?.deepening && res?.deepening2 && res?.untangle && res?.miniUntangle && res?.closureSummary) {
        const safeMiniUntangle = sanitizeMiniUntangle(
          res.miniUntangle,
          res.deepening,
          res.deepening2,
          res.untangle,
        );

        state.setLLMContent(

          state.llmReflection,

          res.deepening,

          res.deepening2,

          res.untangle,

          safeMiniUntangle,
          res.closureSummary

        );

      }

      transition('deepening_2');
      runDeepening2ThenUntangle();
      return;
    }

    if (state.currentStep === 'start') transition('input');
    transition('reflection');
    const res: any = await callLLM({ userInput: text });

    const safeMiniUntangle = sanitizeMiniUntangle(
      res.miniUntangle,
      res.deepening,
      res.deepening2,
      res.untangle,
    );

    state.setLLMContent(

      res.reflection,

      res.deepening,

      res.deepening2,

      res.untangle,

      safeMiniUntangle,
      res.closureSummary ?? ''

    );

    state.addMessage({ role: 'app', text: res.reflection });

    const opts = await generateAlignmentOptions(text, res.reflection, res.deepening);

    state.setDynamicAlignmentOptions([opts.option1, opts.option2]);

    state.addMessage({

      role: 'app',

      text: res.deepening,

      chips: [

        { id: 'a1', label: opts.option1 },

        { id: 'a2', label: opts.option2 },

        { id: 'a3', label: 'something else' },

        { id: 'a4', label: "I don't know" },

      ],

    });

    transition('alignment_choice');

  }, []);

  const handleChipSelect = useCallback(async (chipLabel: string) => {
    const state = useConversationStore.getState();

    switch (state.currentStep) {

      case 'alignment_choice': {

        useConversationStore.getState().addMessage({
          role: 'user',
          text: chipLabel,
        });

        transition('deepening_1');

        break;
      }

      case 'deepening_1': {
        if (chipLabel === 'yeah… that fits') {

          transition('deepening_2');

          runDeepening2ThenUntangle();

        } else {

          state.setClarificationMode(true);

          transition('input');

        }

        break;
      }

      case 'post_untangle': {

        if (chipLabel === 'understand this feeling a bit more') {

          transition('mini_untangle_understand');

        } else if (chipLabel === 'figure out what to do next') {

          transition('mini_untangle_act');

        } else {

          transition('mini_untangle_hold');

        }

        break;
      }

      case 'decision_layer': {
        if (chipLabel === 'sit with this') {
          transition('deepening_2');
          runDeepening2ThenUntangle();
        } else if (chipLabel === 'do something small') {
          transition('mini_untangle_act');
        } else if (chipLabel === 'leave it here') {
          useConversationStore.getState().setCurrentView('closure');
          transition('closure');
        }
        break;
      }
      default:
        console.warn(`[FlowController] Chip tapped in unexpected state: ${state.currentStep}`);
    }
  }, []);

  const handleDismissUntangle = useCallback(() => {
    const state = useConversationStore.getState();

    transition('post_untangle');

    if (state.llmUntangle) {

      state.addMessage({

        role: 'app',

        text: state.llmUntangle,

        type: 'chat',

      });

    }
    state.addMessage({ role: 'app', text: 'Sit with that for a second.' });

    setTimeout(() => {
      useConversationStore.getState().addMessage({
        role: 'app',
        text: 'What feels closer right now?',
        chips: POST_UNTANGLE_CHIPS,
      });
    }, 1000);
  }, []);
  return { handleUserInput, handleChipSelect, handleDismissUntangle };
}
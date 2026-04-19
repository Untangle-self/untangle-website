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
 *   untangle → post_untangle_choice
 *     'it feels clearer' → closure
 *     'still a bit stuck'→ mini_untangle → closure
 *     'what can I do here'→ action → closure
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

// ── System-defined chips (never LLM-generated) ──────────────────────────────

const POST_UNTANGLE_CHIPS = [
  { id: 'p1', label: 'it feels clearer' },
  { id: 'p2', label: 'still a bit stuck' },
  { id: 'p3', label: 'what can I do here' },
];

const ACTION_CHIPS = [
  { id: 'ac1', label: 'say what you need clearly to one person' },
  { id: 'ac2', label: 'take a pause before reacting' },
  { id: 'ac3', label: 'step back from both sides for a bit' },
  { id: 'ac4', label: "I don't know" },
];

const CLOSURE_CHIPS = [
  { id: 'f1', label: 'stay with this a bit more' },
  { id: 'f2', label: 'look at what you can do' },
  { id: 'f3', label: "shift what we're focusing on" },
  { id: 'f4', label: "I think I'm okay for now" },
];

// ── Core transition helper ───────────────────────────────────────────────────

function transition(to: FlowState): void {
  const { currentStep, setStep } = useConversationStore.getState();
  const allowed = VALID_TRANSITIONS[currentStep];
  if (!allowed.includes(to)) {
    console.warn(`[FlowController] Blocked invalid transition: ${currentStep} → ${to}`);
    return;
  }
  assertTransition(currentStep, to);
  setStep(to);
  if (to === 'deepening_2') {
    runDeepening2ThenUntangle();
  }
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// ── Private sequences ────────────────────────────────────────────────────────

async function runDeepening2ThenUntangle() {
<<<<<<< Updated upstream
  useConversationStore.getState().setTyping(true);
  await delay(1200);

  // deepening_1 render: re-surface core pattern as plain landing (no chips)
  const s1 = useConversationStore.getState();
  s1.addMessage({ role: 'app', text: s1.llmDeepening });
  s1.setTyping(true);

  await delay(1200);

  // deepening_2 render
=======
  const { llmDeepening2, llmUntangle } = useConversationStore.getState();

  useConversationStore.getState().setTyping(true);
  await delay(1200);

  // deepening_2 render (snapshotted text so this message always precedes untangle)
>>>>>>> Stashed changes
  const s2 = useConversationStore.getState();
  s2.addMessage({ role: 'app', text: s2.llmDeepening2 });
  s2.setTyping(false);

  await delay(2400);

  // Always trigger untangle — assertTransition inside transition() guards against invalid double-fire
  const s3 = useConversationStore.getState();
  if (s3.llmUntangle) {
    s3.setUntangleReveal(s3.llmUntangle);
    transition('untangle');
    s3.setTyping(false);
  }
}

async function runMiniUntangle() {
  useConversationStore.getState().setTyping(true);
  await delay(1200);

  const s = useConversationStore.getState();
  if (s.llmMiniUntangle) {
    s.addMessage({ role: 'app', text: s.llmMiniUntangle, label: 'untangle' });
  }
  s.setTyping(false);

  await delay(1200);
  transition('closure');
  runClosureSequence();
}

async function runClosureSequence() {
  await delay(800);
  useConversationStore.getState().addMessage({
    role: 'app',
    text: 'Even seeing it this way\nmight already feel a little different.',
  });
  await delay(1000);
  useConversationStore.getState().addMessage({
    role: 'app',
    text: "We can pause here if you want — or where do you feel like going from here?",
    chips: CLOSURE_CHIPS,
  });
}

// ── Exported hook ────────────────────────────────────────────────────────────

export function useFlowController() {

  // ── handleUserInput ──────────────────────────────────────────────────────
  const handleUserInput = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const state = useConversationStore.getState();
    state.addMessage({ role: 'user', text });

    // CLARIFICATION PATH: alignment_choice → input → deepening_2
    if (state.clarificationMode) {
      state.setClarificationMode(false);
      useConversationStore.getState().setTyping(true);
      try {
        const latestMessages = useConversationStore.getState().messages;
        const res: any = await callLLM(text, latestMessages);
        if (res?.deepening && res?.deepening2 && res?.untangle && res?.miniUntangle) {
          useConversationStore.getState().setLLMContent(
            state.llmReflection,
            res.deepening,
            res.deepening2,
            res.untangle,
            res.miniUntangle
          );
        }
      } catch (err) {
        console.error('[FlowController] Deepening_2 refresh failed:', err);
      }
      useConversationStore.getState().setTyping(false);
      transition('deepening_2');
      return;
    }

    // INITIAL PATH: start → input → reflection → deepening_1 → alignment_choice
    if (state.currentStep === 'start') transition('input');
    transition('reflection');
    useConversationStore.getState().setTyping(true);

    try {
      const messages = useConversationStore.getState().messages;
      const res: any = await callLLM(text, messages);

      useConversationStore.getState().setTyping(false);

      if (!res?.reflection || !res?.deepening || !res?.deepening2 || !res?.untangle || !res?.miniUntangle) {
        throw new Error('Incomplete LLM response');
      }

      useConversationStore.getState().setLLMContent(
        res.reflection, res.deepening, res.deepening2, res.untangle, res.miniUntangle
      );
      useConversationStore.getState().addMessage({ role: 'app', text: res.reflection });

      useConversationStore.getState().setTyping(true);

      let option1 = '';
      let option2 = '';
      try {
        const opts = await generateAlignmentOptions(text, res.reflection, res.deepening);
        option1 = opts.option1;
        option2 = opts.option2;
      } catch {
        try {
          const fallback = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: `Based on this emotional insight: "${res.deepening.slice(0, 120)}"
Write exactly two short alignment options (one per line, no numbering, no quotes, ≤12 words each).
They must sound tentative and option-like (not deepening, not conclusions, not analysis):
Line 1 starts with "it's more like"
Line 2 starts with "it feels less like"`,
            }),
          }).then(r => r.json());
          const lines = (fallback.text || '').split('\n').map((l: string) => l.trim()).filter(Boolean);
          option1 = lines[0] || '';
          option2 = lines[1] || '';
        } catch { /* fall through to static below */ }
      }
      if (!option1) option1 = "it's something underneath it";
      if (!option2) option2 = "it feels less about the surface";

      useConversationStore.getState().setDynamicAlignmentOptions([option1, option2]);
      useConversationStore.getState().setTyping(false);

      useConversationStore.getState().addMessage({
        role: 'app',
        text: res.deepening,
        chips: [
          { id: 'a1', label: option1 },
          { id: 'a2', label: option2 },
          { id: 'a3', label: 'something else' },
          { id: 'a4', label: "I don't know" },
        ],
      });

      transition('alignment_choice');

    } catch (err) {
      console.error('[FlowController] LLM call failed:', err);
      useConversationStore.getState().setTyping(false);
    }
  }, []);

  // ── handleChipSelect ─────────────────────────────────────────────────────
  const handleChipSelect = useCallback(async (chipLabel: string) => {
    const state = useConversationStore.getState();
    state.addMessage({ role: 'user', text: chipLabel });

    switch (state.currentStep) {

      case 'alignment_choice': {
        const { dynamicAlignmentOptions } = useConversationStore.getState();
        if (dynamicAlignmentOptions.includes(chipLabel)) {
          transition('deepening_1');
          useConversationStore.getState().addMessage({
            role: 'app',
            text: useConversationStore.getState().llmDeepening,
            chips: [
              { id: 'd1', label: 'yeah… that fits' },
              { id: 'd2', label: 'parts of it' },
              { id: 'd3', label: 'something else' },
            ],
          });
        } else if (chipLabel === "I don't know") {
          useConversationStore.getState().addMessage({
            role: 'app',
            text: "It hasn't fully landed yet — that's okay.\nSay whatever comes up, even if it's messy.",
          });
          useConversationStore.getState().setClarificationMode(true);
          transition('input');
          useConversationStore.getState().setTyping(false);
        } else {
          // 'something else'
          useConversationStore.getState().addMessage({
            role: 'app',
            text: "It hasn't fully landed yet — that's okay.\nSay whatever comes up, even if it's messy.",
          });
          useConversationStore.getState().setClarificationMode(true);
          transition('input');
          useConversationStore.getState().setTyping(false);
        }
        break;
      }

      case 'deepening_1': {
        if (chipLabel === 'yeah… that fits') {
          useConversationStore.getState().addMessage({
            role: 'app',
            text: "Yeah… this is getting closer to what's actually underneath it.",
          });
          try {
            const latestMessages = useConversationStore.getState().messages;
            const res: any = await callLLM(chipLabel, latestMessages);
            if (res?.deepening2 && res?.untangle && res?.miniUntangle) {
              useConversationStore.getState().setLLMContent(
                state.llmReflection,
                state.llmDeepening,
                res.deepening2,
                res.untangle,
                res.miniUntangle
              );
            }
          } catch (err) {
            console.error('[FlowController] Deepening_2 refresh failed:', err);
          }
          transition('deepening_2');
        } else if (chipLabel === 'parts of it') {
          useConversationStore.getState().setClarificationMode(true);
          transition('input');
          useConversationStore.getState().setTyping(false);
        } else if (chipLabel === 'something else') {
          useConversationStore.getState().setClarificationMode(true);
          transition('input');
          useConversationStore.getState().setTyping(false);
        } else if (chipLabel === "I don't know") {
          useConversationStore.getState().setClarificationMode(true);
          transition('input');
          useConversationStore.getState().setTyping(false);
        }
        break;
      }

      case 'post_untangle_choice': {
        if (chipLabel === 'it feels clearer') {
          useConversationStore.getState().addMessage({ role: 'app', text: "That lands a little differently." });
          transition('closure');
          runClosureSequence();
        } else if (chipLabel === 'still a bit stuck') {
          transition('mini_untangle');
          runMiniUntangle();
        } else if (chipLabel === 'what can I do here') {
          transition('action');
          useConversationStore.getState().addMessage({
            role: 'app',
            text: "If you want to do something here, it doesn't have to be about fixing everything.\nWhat feels more possible right now?",
            chips: ACTION_CHIPS,
          });
        }
        break;
      }

      case 'action': {
        const reply = chipLabel === "I don't know"
          ? "That's okay.\nEven knowing you need something different here\nis already a start."
          : "That sounds like a solid next step.\nEven small shifts can change how heavy things feel.";
        useConversationStore.getState().addMessage({ role: 'app', text: reply });
        transition('closure');
        runClosureSequence();
        break;
      }

      default:
        console.warn(`[FlowController] Chip tapped in unexpected state: ${state.currentStep}`);
    }
  }, []);

  // ── handleDismissUntangle ────────────────────────────────────────────────
  const handleDismissUntangle = useCallback(() => {
    const state = useConversationStore.getState();
    transition('post_untangle_choice');

    if (state.llmUntangle) {
      state.addMessage({ role: 'app', text: state.llmUntangle, label: 'untangle' });
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

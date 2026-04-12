import { useEffect, useState, useCallback } from 'react';
import {
  generateUntangleResponse,
  classifySignal,
  hasClarity,
  extractPrimaryFeeling,
  generateMergedReflection,
  generateMergedDeepening,
} from './services/responseService';
import { callLLM } from './services/llmService';
import { AnimatePresence, motion } from 'framer-motion';
import { BackgroundCanvas } from './components/layout/BackgroundCanvas';
import { StartScreen } from './components/layout/StartScreen';
import { UnTangleReveal } from './components/layout/UnTangleReveal';
import { ChatThread } from './components/chat/ChatThread';
import { CTAButton } from './components/controls/CTAButton';
import { SummaryPage } from './components/summary/SummaryPage';
import { ClaritySnapshot } from './components/summary/ClaritySnapshot';
import { useConversationStore } from './store/conversationStore';
import { useFlowEngine } from './hooks/useFlowEngine';
import {
  SCREEN1_MESSAGE,
  SCREEN1_OPTIONS,
  // SCREEN3b_MESSAGE,
  SCREEN4_OPTIONS,
  A1_OPTIONS,
  B2_OPTIONS,
  LOOP_OPTIONS,
} from './data/flowContent';
import type { ChipOption, ChipAttachment } from './types/flow';

// ── Alignment & deepening inline chip options ─────────────────────────────────
const USER_ALIGNMENT_OPTIONS: ChipOption[] = [
  { id: 'fits',              label: 'yeah, that fits' },
  { id: 'not-really-align',  label: 'not really' },
  { id: 'something-else-align', label: 'something else' },
];

// Static deepening chips — always appended after the 2 dynamic LLM chips
const DEEPENING_STATIC_CHIPS: ChipOption[] = [
  { id: 'deep-partial',       label: 'yeah… part of it' },
  { id: 'deep-something-else', label: 'something else' },
];

// Fallback deepening chips used only when LLM chips are not yet loaded
const DEEPENING_FALLBACK_CHIPS: ChipOption[] = [
  { id: 'deep-expressive-1', label: "it's more like something hasn't landed yet" },
  { id: 'deep-expressive-2', label: "it's more like I can't quite name what it is" },
  ...DEEPENING_STATIC_CHIPS,
];

// Deepening 2 chips — alignment + commit model (3 chips, no exploratory options)
const DEEPENING_2_CHIPS: ChipOption[] = [
  { id: 'deep2-confirm',      label: "yeah… that's it" },
  { id: 'deep2-partial',      label: 'yeah… part of it' },
  { id: 'deep2-something-else', label: 'something else' },
];

interface CTAOnlyConfig {
  type: 'cta-only';
  ctaLabel: string;
}

// end-options: terminal choices rendered as buttons in the bottom bar (no chip message needed)
interface EndOptionsConfig {
  type: 'end-options';
  options: ChipOption[];
}

type ActiveControlConfig =
  | { type: 'chips'; options: ChipOption[]; ctaLabel: string }
  | CTAOnlyConfig
  | EndOptionsConfig
  | { type: 'none' }
  | { type: 'summary' };

const CONTROL_CONFIGS: Record<string, ActiveControlConfig> = {
  start:    { type: 'none' },
  // LLM free-input steps
  'user-reflection': { type: 'none' },
  'user-alignment':  { type: 'chips', options: USER_ALIGNMENT_OPTIONS, ctaLabel: 'Go with this' },
  'user-deepening':   { type: 'chips', options: DEEPENING_FALLBACK_CHIPS,  ctaLabel: 'Go with this' },
  'user-deepening-2': { type: 'chips', options: DEEPENING_2_CHIPS,         ctaLabel: 'Go with this' },
  'user-untangle':    { type: 'none' },
  screen1:  { type: 'chips',    options: SCREEN1_OPTIONS, ctaLabel: 'Go with this' },
  screen1b: { type: 'cta-only', ctaLabel: 'Stay with this' },
  screen2:  { type: 'cta-only', ctaLabel: 'Stay with this' },
  screen3:  { type: 'cta-only', ctaLabel: 'Go on' },
  screen3b: { type: 'none' },
  screen4:  { type: 'chips',    options: SCREEN4_OPTIONS, ctaLabel: 'Go with this' },
  // Path A
  A1:  { type: 'chips',    options: A1_OPTIONS,  ctaLabel: 'Go with this' },
  A2:  { type: 'cta-only', ctaLabel: 'Go on' },
  A3:  { type: 'none' },
  // Path B
  B1:  { type: 'chips',    options: B2_OPTIONS,  ctaLabel: 'That feels close' },
  B3:  { type: 'cta-only', ctaLabel: 'Go on' },
  B4:  { type: 'none' },
  // Path C
  C1:  { type: 'cta-only', ctaLabel: 'Stay with this' },
  C2:  { type: 'cta-only', ctaLabel: 'Go on' },
  C3:  { type: 'cta-only', ctaLabel: 'Stay with this' },
  C4:  { type: 'none' },
  // Loop
  'loop-nudge':    { type: 'none' },
  'loop-decision': { type: 'chips', options: LOOP_OPTIONS, ctaLabel: 'Go with this' },
  summary: { type: 'summary' },
  clarity: { type: 'summary' },
};

const CHIP_OPTIONS_MAP: Record<string, ChipOption[]> = {
  screen1: SCREEN1_OPTIONS,
  screen4: SCREEN4_OPTIONS,
  A1: A1_OPTIONS,
  B1: B2_OPTIONS,
  'user-alignment': USER_ALIGNMENT_OPTIONS,
  'user-deepening':   DEEPENING_FALLBACK_CHIPS,
  'user-deepening-2': DEEPENING_2_CHIPS,
  'loop-decision': LOOP_OPTIONS,
};

export default function App() {
  const {
    currentStep,
    isTyping,
    addMessage,
    addMessageWithChips,
    lockChipSelection,
    setTyping,
    setStep,
    untangleReveal,
    setUntangleReveal,
    setMiniUntangleText,
    setLLMResponse,
    previousFeelingWord,
    setPreviousFeelingWord,
    llmDeepening,
    llmDeepeningChips,
    llmAlignmentOptions,
    llmScreen4Options,
    llmPathA,
    llmPathB,
    hasAligned,
    setHasAligned,
    activeChipsMsgIndex,
    chipStepForMsg,
    lockedChipSelections,
    reset,
  } = useConversationStore();
  const { advanceStep } = useFlowEngine();

  const [chipSelections, setChipSelections] = useState<string[]>([]);
  const [controlsLocked, setControlsLocked] = useState(false);
  const [controlsReady, setControlsReady] = useState(false);
  const [freeInputVisible, setFreeInputVisible] = useState(false);
  const [freeInputValue, setFreeInputValue] = useState('');

  useEffect(() => {
    setChipSelections([]);
    setControlsLocked(false);
    setControlsReady(false);
    setFreeInputVisible(false);
    setFreeInputValue('');
  }, [currentStep]);

  // Auto-submit on chip tap for all inline chip steps
  useEffect(() => {
    const config = CONTROL_CONFIGS[currentStep];
    if (config?.type !== 'chips') return;
    if (chipSelections.length === 0) return;
    if (controlsLocked) return;
    // Cases that open free input instead of auto-advancing
    const wantsInput =
      chipSelections.includes('other') ||
      (currentStep === 'A1' && chipSelections.includes('unknown')) ||
      (currentStep === 'user-alignment' && chipSelections.includes('something-else-align')) ||
      (currentStep === 'user-deepening' && chipSelections.includes('deep-partial')) ||
      (currentStep === 'user-deepening' && chipSelections.includes('deep-something-else')) ||
      (currentStep === 'user-deepening-2' && chipSelections.includes('deep2-partial')) ||
      (currentStep === 'user-deepening-2' && chipSelections.includes('deep2-something-else')) ||
      (currentStep === 'loop-decision' && chipSelections.includes('loop-shift'));
    if (wantsInput) {
      setFreeInputVisible(true);
      return;
    }
    const t = setTimeout(() => handleCTA(), 420);
    return () => clearTimeout(t);
  }, [chipSelections]);

  // 0.5s pause after typing before controls appear
  useEffect(() => {
    if (isTyping) { setControlsReady(false); return; }
    const t = setTimeout(() => setControlsReady(true), 500);
    return () => clearTimeout(t);
  }, [isTyping]);

  // Auto-advance screen3b after 1.2s (no CTA)
  useEffect(() => {
    if (currentStep !== 'screen3b' || isTyping || !controlsReady) return;
    const t = setTimeout(() => advanceStep(), 1200);
    return () => clearTimeout(t);
  }, [currentStep, isTyping, controlsReady]);

  // Auto-advance user-reflection after 2s → always go straight to deepening.
  // setTyping(true → false) is required to pump the isTyping effect so
  // controlsReady recovers after the step-change reset.
  useEffect(() => {
    if (currentStep !== 'user-reflection' || isTyping || !controlsReady) return;
    const t = setTimeout(() => {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        addMessageWithChips({ role: 'app', text: llmDeepening }, 'user-deepening');
        setStep('user-deepening');
      }, 800);
    }, 2000);
    return () => clearTimeout(t);
  }, [currentStep, isTyping, controlsReady, llmDeepening]);

  // Auto-advance landing steps (A3, B4, C4) directly to loop-decision
  useEffect(() => {
    if (!(['A3', 'B4', 'C4'] as string[]).includes(currentStep) || isTyping || !controlsReady) return;
    const t = setTimeout(() => advanceStep(), 2000);
    return () => clearTimeout(t);
  }, [currentStep, isTyping, controlsReady]);

  // Auto-advance loop-nudge (fallback — not normally reached)
  useEffect(() => {
    if (currentStep !== 'loop-nudge' || isTyping || !controlsReady) return;
    const t = setTimeout(() => advanceStep(), 1500);
    return () => clearTimeout(t);
  }, [currentStep, isTyping, controlsReady]);

  // Shared: show untangle after a brief reading pause following a reflection
  // Used by any handler that has confirmed clarity is sufficient.
  const revealUntangleAfterReflection = useCallback((untangleText: string) => {
    setTimeout(() => {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setUntangleReveal(untangleText);
        setStep('user-untangle');
      }, 1500);
    }, 700);
  }, [setTyping, setUntangleReveal, setStep]);

  // Free-input → LLM path
  // Clarity-first rule: if the input has enough structure, skip deepening entirely.
  // If clarity is insufficient, stay in user-reflection → auto-advance fires → deepening loop.
  const handleFreeSubmit = useCallback(async (userText: string) => {
    addMessage({ role: 'user', text: userText });
    setTyping(true);
    setStep('user-reflection');
    //const signal = classifySignal(userText);          // fresh per input — never reuse
    //const response = await generateUntangleResponse(userText, signal);
    const response: any = await callLLM(userText);
    //setLLMResponse(response);
    // Anchor the emotional thread — used by "part of it fits" merge path
    setPreviousFeelingWord(extractPrimaryFeeling(userText));
    setTyping(false);
    addMessage({ role: 'app', text: response.reflection });
    // CLARITY RULE (Rules 1–3): if input has sufficient structure, go straight to untangle.
    // No deepening round needed — the reflection is enough to land the insight.
    if (hasClarity(userText) && response.untangle) {
      revealUntangleAfterReflection(response.untangle);
    }
    // else: stay in user-reflection → auto-advance fires → deepening loop
  }, [addMessage, setTyping, setStep, setLLMResponse, setPreviousFeelingWord, revealUntangleAfterReflection]);

  // Demo → scripted path (pre-filled user message, then scripted chips)
  const handleDemoSubmit = useCallback(() => {
    addMessage({ role: 'user', text: "I feel like I'm handling multiple people and I don't know what to do" });
    setStep('screen1');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      addMessageWithChips({ role: 'app', text: SCREEN1_MESSAGE }, 'screen1');
      setStep('screen1');
    }, 1500);
  }, [addMessage, addMessageWithChips, setTyping, setStep]);

  // A1 "I don't know" chip → LLM mini-untangle only
  const handleA1LLMFreeInput = useCallback(async (userText: string) => {
    addMessage({ role: 'user', text: userText });
    setTyping(true);
    const signal = classifySignal(userText);
    const response = await generateUntangleResponse(userText, signal);
    const miniText = response.untangle;
    setMiniUntangleText(miniText);
    setTyping(false);
    addMessage({ role: 'app', text: miniText, label: 'mini-untangle' });
    setStep('A2');
  }, [addMessage, setTyping, setMiniUntangleText, setStep]);

  // Alignment "something else" → re-run LLM from user's correction.
  // CONTINUATION RULE: alignment has already been shown once — never show it again.
  // Go straight to untangle (if clear) or deepening (if not).
  const handleAlignmentRetry = useCallback(async (userText: string) => {
    addMessage({ role: 'user', text: userText });
    setTyping(true);
    setStep('user-reflection');
    const signal = classifySignal(userText);          // fresh per input — never reuse
    const response = await generateUntangleResponse(userText, signal);
    setLLMResponse(response);
    setPreviousFeelingWord(extractPrimaryFeeling(userText));
    setTyping(false);
    addMessage({ role: 'app', text: response.reflection });
    if (hasClarity(userText) && response.untangle) {
      revealUntangleAfterReflection(response.untangle);
    } else {
      // Skip alignment — go directly to deepening.
      // CONTINUATION LOCK: user has refined their alignment input — treat all subsequent as continuation.
      setHasAligned(true);
      setTimeout(() => {
        setTyping(true);
        setTimeout(() => {
          setTyping(false);
          addMessageWithChips({ role: 'app', text: response.deepening }, 'user-deepening');
          setStep('user-deepening');
        }, 1500);
      }, 400);
    }
  }, [addMessage, addMessageWithChips, setTyping, setStep, setLLMResponse, setPreviousFeelingWord, setHasAligned, revealUntangleAfterReflection]);

  // Loop "shift" → re-run full LLM flow from new input
  const handleLoopShift = useCallback(async (userText: string) => {
    addMessage({ role: 'user', text: userText });
    setTyping(true);
    setStep('user-reflection');
    const signal = classifySignal(userText);          // fresh per input — never reuse
    const response = await generateUntangleResponse(userText, signal);
    setLLMResponse(response);
    setPreviousFeelingWord(extractPrimaryFeeling(userText));
    setTyping(false);
    addMessage({ role: 'app', text: response.reflection });
    const clear = hasClarity(userText);
    if (clear && response.untangle) {
      revealUntangleAfterReflection(response.untangle);
    }
    // else: stay in user-reflection → auto-advance fires → deepening loop
  }, [addMessage, setTyping, setStep, setLLMResponse, setPreviousFeelingWord, revealUntangleAfterReflection]);

  // GLOBAL CONTINUATION HANDLER
  // Once hasAligned = true, ALL user inputs route here — regardless of stage, chip, or mode.
  // Validation outcome ("not really", "part of it fits") affects ONLY tone, not routing.
  // Always: deepening (plain, no chips) → untangle (always).
  const handleContinuation = useCallback(async (userText: string) => {
    addMessage({ role: 'user', text: userText });
    setHasAligned(true);
    setTyping(true);
    const signal = classifySignal(userText);
    const response = await generateUntangleResponse(userText, signal);
    // Preserve existing alignment/screen4 options — already-shown messages must not change
    setLLMResponse({
      ...response,
      alignmentOptions: llmAlignmentOptions ?? response.alignmentOptions,
      screen4Options: llmScreen4Options ?? response.screen4Options,
    });
    const newFeelingWord = extractPrimaryFeeling(userText);
    setPreviousFeelingWord(newFeelingWord);
    setTimeout(() => {
      setTyping(false);
      addMessage({ role: 'app', text: response.deepening });
      // FLOW RULE: untangle is a deterministic step in continuation — always shown.
      // If the generator returned empty (no extractable terms), build a guaranteed fallback
      // from the feeling anchor so the phase never gets skipped.
      const feelingAnchor = newFeelingWord || previousFeelingWord || 'this';
      const untangleText = response.untangle ||
        `It's not just that you're ${feelingAnchor}.\n\nThis has been sitting with you — longer than it should have to.\n\n**That's what makes it hard to shake.**`;
      setTimeout(() => {
        setUntangleReveal(untangleText);
        setStep('user-untangle');
      }, 1800);
    }, 800);
  }, [addMessage, setTyping, setHasAligned, setLLMResponse, setUntangleReveal, setStep, setPreviousFeelingWord, previousFeelingWord, llmAlignmentOptions, llmScreen4Options]);

  // Deepening "not really" / "part of it fits" → re-anchor to user's words.
  // USER EXPANSION RULE: reflect their input first, THEN decide.
  // NON-LINEAR FLOW RULE:
  //   - if clarity is now sufficient → show untangle
  //   - if still not clear → loop back into deepening (another round)
  //
  // mode 'partial': "part of it fits" — MERGE previous feeling with new context.
  //   Previous feeling word is preserved. New context explains WHY it exists.
  //   Reflection must answer: "why does the original feeling exist?" not "what happened".
  //
  // mode 'retry': "not really" — full reclassification, update feeling anchor.
  const handleDeepeningRetry = useCallback(async (userText: string, mode: 'partial' | 'retry' = 'retry') => {
    addMessage({ role: 'user', text: userText });
    // CONTINUATION LOCK: reaching validation means the alignment phase is done.
    // All subsequent inputs are continuation regardless of how we got here.
    setHasAligned(true);
    setTyping(true);
    const signal = classifySignal(userText);          // fresh per input — never reuse
    const response = await generateUntangleResponse(userText, signal);

    let deeepText: string;

    if (mode === 'partial' && previousFeelingWord) {
      const mergedReflection = generateMergedReflection(previousFeelingWord, signal, userText);
      const mergedDeepening  = generateMergedDeepening(previousFeelingWord, signal, userText);
      // Always preserve alignment/screen4 options — already-shown messages must not change
      setLLMResponse({
        ...response,
        reflection: mergedReflection,
        deepening: mergedDeepening,
        alignmentOptions: llmAlignmentOptions ?? response.alignmentOptions,
        screen4Options: llmScreen4Options ?? response.screen4Options,
      });
      deeepText = mergedDeepening;
    } else {
      setLLMResponse({
        ...response,
        alignmentOptions: llmAlignmentOptions ?? response.alignmentOptions,
        screen4Options: llmScreen4Options ?? response.screen4Options,
      });
      setPreviousFeelingWord(extractPrimaryFeeling(userText));
      deeepText = response.deepening;
    }

    // DEEPENING 2: show with alignment chips — untangle triggers from chip selection.
    setTimeout(() => {
      setTyping(false);
      addMessageWithChips({ role: 'app', text: deeepText }, 'user-deepening-2');
      setStep('user-deepening-2');
    }, 800);
  }, [addMessage, addMessageWithChips, setTyping, setLLMResponse, setStep, previousFeelingWord, setPreviousFeelingWord, setHasAligned, llmAlignmentOptions, llmScreen4Options]);

  const handleUntangleSeen = () => {
    const text = untangleReveal;
    if (text) addMessage({ role: 'app', text, label: 'Untangle' });
    setUntangleReveal(null);
    advanceStep();
  };

  const handleCTA = () => {
    if (controlsLocked) return;
    setControlsLocked(true);
    // Use dynamic options for screen4/A1/B1 in LLM flow
    const ctaConfig =
      (currentStep === 'user-alignment' && llmAlignmentOptions) ? { type: 'chips' as const, options: llmAlignmentOptions } :
      (currentStep === 'user-deepening') ? { type: 'chips' as const, options: deeepChips } :
      (currentStep === 'screen4' && llmScreen4Options) ? { type: 'chips' as const, options: llmScreen4Options } :
      (currentStep === 'A1' && llmPathA) ? { type: 'chips' as const, options: llmPathA.options } :
      (currentStep === 'B1' && llmPathB) ? { type: 'chips' as const, options: llmPathB.options } :
      CONTROL_CONFIGS[currentStep];
    if (ctaConfig?.type === 'chips') {
      const chipsConfig = ctaConfig as { type: 'chips'; options: ChipOption[] };
      if (activeChipsMsgIndex !== null) lockChipSelection(activeChipsMsgIndex, chipSelections);
      // STAGE RULE: mark alignment as completed so it is never shown again
      if (currentStep === 'user-alignment' && !chipSelections.includes('something-else-align')) {
        setHasAligned(true);
      }
      // CONTINUATION LOCK: any validation chip ("this feels close" etc.) locks continuation state
      if (currentStep === 'user-deepening') {
        setHasAligned(true);
      }
      advanceStep(chipsConfig.options.filter(o => chipSelections.includes(o.id)).map(o => o.label));
    } else {
      advanceStep();
    }
  };

  const handleFreeInputSubmit = () => {
    const trimmed = freeInputValue.trim();
    if (!trimmed || controlsLocked) return;
    setControlsLocked(true);
    setFreeInputVisible(false);
    if (activeChipsMsgIndex !== null) lockChipSelection(activeChipsMsgIndex, chipSelections);
    // GLOBAL CONTINUATION OVERRIDE: once alignment is complete, ALL inputs bypass stage routing.
    // This executes before any chip or stage checks — it is the highest-priority rule.
    if (hasAligned && currentStep !== 'user-alignment' && currentStep !== 'A1' && currentStep !== 'loop-decision' && currentStep !== 'user-deepening-2') {
      handleContinuation(trimmed);
      return;
    }
    // A1 "I don't know" → LLM mini-untangle
    if (currentStep === 'A1' && chipSelections.includes('unknown')) {
      handleA1LLMFreeInput(trimmed);
      return;
    }
    // Alignment "something else" → re-run LLM from reflection
    if (currentStep === 'user-alignment' && chipSelections.includes('something-else-align')) {
      handleAlignmentRetry(trimmed);
      return;
    }
    // Deepening 1 "yeah… part of it" → merge: keep original feeling, integrate new context
    if (currentStep === 'user-deepening' && chipSelections.includes('deep-partial')) {
      handleDeepeningRetry(trimmed, 'partial');
      return;
    }
    // Deepening 1 "something else" → full reclassification from user's own words
    if (currentStep === 'user-deepening' && chipSelections.includes('deep-something-else')) {
      handleDeepeningRetry(trimmed, 'retry');
      return;
    }
    // Deepening 2 "yeah… part of it" → refine current direction (partial merge)
    if (currentStep === 'user-deepening-2' && chipSelections.includes('deep2-partial')) {
      handleDeepeningRetry(trimmed, 'partial');
      return;
    }
    // Deepening 2 "something else" → full redirect
    if (currentStep === 'user-deepening-2' && chipSelections.includes('deep2-something-else')) {
      handleDeepeningRetry(trimmed, 'retry');
      return;
    }
    // Loop "shift" → new LLM flow
    if (currentStep === 'loop-decision' && chipSelections.includes('loop-shift')) {
      handleLoopShift(trimmed);
      return;
    }
    advanceStep([trimmed]);
  };

  // Dynamic chips for LLM flow
  const screen4Options = llmScreen4Options ?? SCREEN4_OPTIONS;
  const deeepChips = llmDeepeningChips ? [...llmDeepeningChips, ...DEEPENING_STATIC_CHIPS] : DEEPENING_FALLBACK_CHIPS;
  const config =
    (currentStep === 'user-alignment' && llmAlignmentOptions) ? { type: 'chips' as const, options: llmAlignmentOptions, ctaLabel: 'Go with this' } :
    (currentStep === 'user-deepening') ? { type: 'chips' as const, options: deeepChips, ctaLabel: 'Go with this' } :
    (currentStep === 'screen4' && llmScreen4Options) ? { type: 'chips' as const, options: llmScreen4Options, ctaLabel: 'Go with this' } :
    (currentStep === 'A1' && llmPathA) ? { type: 'chips' as const, options: llmPathA.options, ctaLabel: 'Go with this' } :
    (currentStep === 'B1' && llmPathB) ? { type: 'chips' as const, options: llmPathB.options, ctaLabel: 'That feels close' } :
    CONTROL_CONFIGS[currentStep];

  if (currentStep === 'summary') {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <BackgroundCanvas />
        <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <SummaryPage />
        </div>
      </div>
    );
  }

  if (currentStep === 'clarity') {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <BackgroundCanvas />
        <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ClaritySnapshot />
        </div>
      </div>
    );
  }

  if (currentStep === 'start') {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <BackgroundCanvas />
        <StartScreen onFreeSubmit={handleFreeSubmit} onDemoSubmit={handleDemoSubmit} />
      </div>
    );
  }

  // Build chip attachments map for ChatThread
  const chipAttachments: Record<number, ChipAttachment> = {};

  // Resolve chip options for a step — dynamic for screen4, A1, B1 in LLM flow
  const getOptionsForStep = (stepName: string): ChipOption[] => {
    if (stepName === 'user-alignment' && llmAlignmentOptions) return llmAlignmentOptions;
    if (stepName === 'user-deepening') return llmDeepeningChips ? [...llmDeepeningChips, ...DEEPENING_STATIC_CHIPS] : DEEPENING_FALLBACK_CHIPS;
    if (stepName === 'user-deepening-2') return DEEPENING_2_CHIPS;
    if (stepName === 'screen4' && llmScreen4Options) return screen4Options;
    if (stepName === 'A1' && llmPathA) return llmPathA.options;
    if (stepName === 'B1' && llmPathB) return llmPathB.options;
    return CHIP_OPTIONS_MAP[stepName] || [];
  };

  Object.entries(lockedChipSelections).forEach(([idx, selected]) => {
    const msgIndex = Number(idx);
    const stepName = chipStepForMsg[msgIndex];
    const options = getOptionsForStep(stepName);
    chipAttachments[msgIndex] = { options, selected, locked: true, onSelect: () => {} };
  });

  if (activeChipsMsgIndex !== null && !isTyping && !(activeChipsMsgIndex in lockedChipSelections)) {
    const stepName = chipStepForMsg[activeChipsMsgIndex];
    const options = getOptionsForStep(stepName);
    chipAttachments[activeChipsMsgIndex] = {
      options,
      selected: chipSelections,
      locked: controlsLocked || !controlsReady || freeInputVisible,
      onSelect: (id: string) => {
        if (!controlsLocked && controlsReady) {
          setFreeInputVisible(false);
          setFreeInputValue('');
          setChipSelections([id]);
        }
      },
    };
  }

  const showCTA = !isTyping && controlsReady && config?.type === 'cta-only' && !untangleReveal;
  const showEndOptions = !isTyping && controlsReady && config?.type === 'end-options' && !untangleReveal;

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <BackgroundCanvas />
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <ChatThread chipAttachments={chipAttachments} />

        <AnimatePresence mode="wait">
          {freeInputVisible && !controlsLocked && (
            <motion.div
              key="free-input"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25 }}
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 20px', paddingBottom: 'max(28px, calc(env(safe-area-inset-bottom) + 12px))', background: 'linear-gradient(to bottom, rgba(237,230,214,0) 0%, rgba(237,230,214,0.92) 30%)', backdropFilter: 'blur(8px)' }}
            >
              <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: '16px', padding: '14px 16px', boxShadow: '0 1px 12px rgba(0,0,0,0.07)' }}>
                <textarea
                  autoFocus
                  value={freeInputValue}
                  onChange={e => setFreeInputValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFreeInputSubmit(); } }}
                  placeholder={
                    (currentStep === 'user-deepening' && chipSelections.includes('deep-partial'))
                      ? "What part doesn't quite fit?"
                      : (currentStep === 'user-deepening' && chipSelections.includes('deep-something-else'))
                      ? "What's closer to it?"
                      : (currentStep === 'user-deepening-2' && chipSelections.includes('deep2-partial'))
                      ? "What part doesn't quite fit?"
                      : (currentStep === 'user-deepening-2' && chipSelections.includes('deep2-something-else'))
                      ? "What's closer to it?"
                      : (currentStep === 'user-alignment' && chipSelections.includes('something-else-align'))
                      ? "What fits better?"
                      : "tell me more…"
                  }
                  rows={2}
                  style={{ width: '100%', border: 'none', background: 'transparent', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', lineHeight: '1.6', color: '#2C2C2C', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button
                    onClick={handleFreeInputSubmit}
                    disabled={!freeInputValue.trim()}
                    style={{ background: 'none', border: 'none', cursor: freeInputValue.trim() ? 'pointer' : 'default', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s ease', opacity: freeInputValue.trim() ? 1 : 0.35 }}
                    aria-label="Send"
                  >
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="14" cy="14" r="14" fill={freeInputValue.trim() ? '#C4956A' : '#D4B99A'} />
                      <path d="M10 14h8M15 11l3 3-3 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {showCTA && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 20px', paddingBottom: 'max(28px, calc(env(safe-area-inset-bottom) + 12px))', background: 'linear-gradient(to bottom, rgba(237,230,214,0) 0%, rgba(237,230,214,0.85) 30%)', backdropFilter: 'blur(8px)' }}
            >
              <CTAButton label={(config as CTAOnlyConfig).ctaLabel} onClick={handleCTA} disabled={controlsLocked} />
            </motion.div>
          )}

          {showEndOptions && (
            <motion.div
              key={`end-${currentStep}`}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 20px', paddingBottom: 'max(28px, calc(env(safe-area-inset-bottom) + 12px))', background: 'linear-gradient(to bottom, rgba(237,230,214,0) 0%, rgba(237,230,214,0.85) 30%)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              {(config as EndOptionsConfig).options.map((opt) => (
                <CTAButton
                  key={opt.id}
                  label={opt.label}
                  disabled={controlsLocked}
                  onClick={() => {
                    if (controlsLocked) return;
                    setControlsLocked(true);
                    if (opt.id === 'start') reset();
                    else advanceStep();
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {untangleReveal && <UnTangleReveal text={untangleReveal} onSeen={handleUntangleSeen} />}
      </AnimatePresence>
    </div>
  );
}

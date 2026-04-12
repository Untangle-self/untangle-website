import { useCallback } from 'react';
import { useConversationStore } from '../store/conversationStore';
import type { FlowStep, Branch, A1Selection } from '../types/flow';
import {
  SCREEN1_OPTIONS,
  getScreen2Message, SCREEN1b_MESSAGE,
  SCREEN3_MESSAGE, SCREEN3b_MESSAGE, SCREEN4_MESSAGE,
  A1_MESSAGE, getA2Message, A3_MESSAGE,
  B1_MESSAGE, getB4Message, B5_MESSAGE,
  C1_MESSAGE, C2_MESSAGE, C3_MESSAGE, C4_MESSAGE,
  LOOP_DECISION_MESSAGE,
} from '../data/flowContent';


const TYPING_DELAY = 1500;

export function useFlowEngine() {
  const {
    currentStep, a1Selection,
    llmDeepening, llmUntangle, llmPatternType,
    llmAlignmentOptions, llmScreen4Options, llmPathA, llmPathB, llmPathC,
    loopCount, incrementLoopCount,
    addMessage, addMessageWithChips, setTyping, setStep, setBranch, setA1Selection,
    setCoreUntangleText, setMiniUntangleText, setUntangleReveal,
  } = useConversationStore();

  const sendAppMessage = useCallback((text: string, nextStep: FlowStep, label?: string) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      addMessage({ role: 'app', text, label });
      setStep(nextStep);
    }, TYPING_DELAY);
  }, [addMessage, setTyping, setStep]);

  const sendChipMessage = useCallback((text: string, nextStep: FlowStep) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      addMessageWithChips({ role: 'app', text }, nextStep);
      setStep(nextStep);
    }, TYPING_DELAY);
  }, [addMessageWithChips, setTyping, setStep]);

  const advanceStep = useCallback((userSelections?: string[]) => {
    if (userSelections && userSelections.length > 0) {
      addMessage({ role: 'user', text: userSelections.join(', ') });
    }

    switch (currentStep) {

      // ── LLM free-input flow ──────────────────────────────────────────────
      // user-reflection auto-advances to user-deepening directly in App.tsx

      case 'user-deepening': {
        const sel = userSelections?.[0];
        // Any chip except "something else" advances to untangle
        if (sel && sel !== 'something else') {
          if (llmUntangle) {
            setUntangleReveal(llmUntangle);
            setStep('user-untangle');
          } else {
            sendAppMessage(SCREEN3b_MESSAGE, 'screen3b');
          }
        }
        // 'something else' → free input handled in App.tsx
        break;
      }

      case 'user-deepening-2': {
        const sel = userSelections?.[0];
        // "yeah… that's it" → proceed to untangle
        if (sel === "yeah… that's it") {
          if (llmUntangle) {
            setUntangleReveal(llmUntangle);
            setStep('user-untangle');
          } else {
            sendAppMessage(SCREEN3b_MESSAGE, 'screen3b');
          }
        }
        // "yeah… part of it" / "something else" → free input handled in App.tsx
        break;
      }

      case 'user-untangle':
        setCoreUntangleText(llmUntangle);
        sendAppMessage(SCREEN3b_MESSAGE, 'screen3b');
        break;

      // ── Light flow ────────────────────────────────────────────────────────
      case 'screen1': {
        const sel = userSelections?.[0] || '';
        const isKnownChip = SCREEN1_OPTIONS.some(o => o.id !== 'other' && o.label === sel);
        if (isKnownChip) {
          sendAppMessage(getScreen2Message(sel), 'screen2');
        } else {
          // free-input path: intermediate acknowledgment first
          sendAppMessage(SCREEN1b_MESSAGE, 'screen1b');
        }
        break;
      }

      case 'screen1b':
        sendAppMessage(getScreen2Message('other'), 'screen2');
        break;

      case 'screen2':
        setTyping(true);
        setTimeout(() => {
          setTyping(false);
          setUntangleReveal(SCREEN3_MESSAGE);
          setStep('screen3');
        }, TYPING_DELAY);
        break;

      case 'screen3':
        setCoreUntangleText(SCREEN3_MESSAGE);
        sendAppMessage(SCREEN3b_MESSAGE, 'screen3b');
        break;

      case 'screen3b':
        sendChipMessage(SCREEN4_MESSAGE, 'screen4');
        break;

      case 'screen4': {
        const sel = userSelections?.[0];
        let branch: Branch = 'C';
        // Static labels (demo/scripted path)
        if (sel === 'stay with this') branch = 'A';
        else if (sel === 'what can I do here') branch = 'B';
        // Dynamic LLM chips — resolve label to id for branch mapping
        else if (llmScreen4Options) {
          const matched = llmScreen4Options.find(o => o.label === sel);
          if (matched?.id === 'llm-a') branch = 'A';
          else if (matched?.id === 'llm-b') branch = 'B';
        }
        setBranch(branch);
        if (branch === 'A') sendChipMessage(llmPathA ? llmPathA.message : A1_MESSAGE, 'A1');
        else if (branch === 'B') sendChipMessage(llmPathB ? llmPathB.message : B1_MESSAGE, 'B1');
        else sendAppMessage(llmPathC ? llmPathC.c1 : C1_MESSAGE, 'C1');
        break;
      }

      // ── Path A ────────────────────────────────────────────────────────────
      case 'A1': {
        const sel = userSelections?.[0];
        if (llmPathA) {
          // Dynamic: look up mini-untangle by selected chip label
          const a2Text = llmPathA.miniUntangles[sel || ''] || llmPathA.closingMessage;
          setMiniUntangleText(a2Text);
          sendAppMessage(a2Text, 'A2', 'mini-untangle');
        } else {
          // Static scripted path
          let a1Sel: A1Selection = 'unknown';
          if (sel === 'feeling pulled in both directions') a1Sel = 'pulled';
          else if (sel === "feeling like there's no space for you in it") a1Sel = 'unseen';
          setA1Selection(a1Sel);
          const a2Text = getA2Message(a1Sel);
          setMiniUntangleText(a2Text);
          sendAppMessage(a2Text, 'A2', 'mini-untangle');
        }
        break;
      }

      case 'A2':
        sendAppMessage(llmPathA ? llmPathA.closingMessage : A3_MESSAGE, 'A3');
        break;

      case 'A3':
        incrementLoopCount();
        sendChipMessage(LOOP_DECISION_MESSAGE, 'loop-decision');
        break;

      // ── Path B ────────────────────────────────────────────────────────────
      case 'B1': {
        const sel = userSelections?.[0] || '';
        if (llmPathB) {
          const b3Text = llmPathB.miniUntangles[sel] || llmPathB.landingMessage;
          setMiniUntangleText(b3Text);
          sendAppMessage(b3Text, 'B3', 'mini-untangle');
        } else {
          const b3Text = getB4Message(sel);
          setMiniUntangleText(b3Text);
          sendAppMessage(b3Text, 'B3', 'mini-untangle');
        }
        break;
      }

      case 'B3':
        sendAppMessage(llmPathB ? llmPathB.landingMessage : B5_MESSAGE, 'B4');
        break;

      case 'B4':
        incrementLoopCount();
        sendChipMessage(LOOP_DECISION_MESSAGE, 'loop-decision');
        break;

      // ── Path C ────────────────────────────────────────────────────────────
      case 'C1': {
        const c2Text = llmPathC ? llmPathC.c2 : C2_MESSAGE;
        setMiniUntangleText(c2Text);
        sendAppMessage(c2Text, 'C2', 'mini-untangle');
        break;
      }

      case 'C2':
        sendAppMessage(llmPathC ? llmPathC.c3 : C3_MESSAGE, 'C3');
        break;

      case 'C3':
        sendAppMessage(llmPathC ? llmPathC.c4 : C4_MESSAGE, 'C4');
        break;

      case 'C4':
        incrementLoopCount();
        sendChipMessage(LOOP_DECISION_MESSAGE, 'loop-decision');
        break;

      // ── Loop ───────────────────────────────────────────────────────────────
      case 'loop-nudge':
        incrementLoopCount();
        sendChipMessage(LOOP_DECISION_MESSAGE, 'loop-decision');
        break;

      case 'loop-decision': {
        const sel = userSelections?.[0];
        if (sel === 'stay with this a bit more') {
          sendChipMessage(llmPathA ? llmPathA.message : A1_MESSAGE, 'A1');
          setBranch('A');
        } else if (sel === 'look at what you can do') {
          sendChipMessage(llmPathB ? llmPathB.message : B1_MESSAGE, 'B1');
          setBranch('B');
        } else if (sel === "I think I'm okay for now") {
          setStep('summary');
        }
        // 'shift what we're focusing on' → free input handled in App.tsx
        break;
      }

      default:
        break;
    }
  }, [currentStep, a1Selection, llmDeepening, llmUntangle, llmPatternType, llmAlignmentOptions, llmPathA, llmPathB, llmPathC, loopCount, incrementLoopCount, addMessage, sendAppMessage, sendChipMessage, setBranch, setA1Selection, setCoreUntangleText, setMiniUntangleText, setStep, setTyping, setUntangleReveal]);

  return { advanceStep };
}

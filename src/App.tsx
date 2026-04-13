import { useCallback } from 'react';
import { callLLM } from './services/llmService.ts';
import { AnimatePresence } from 'framer-motion';
import { BackgroundCanvas } from './components/layout/BackgroundCanvas';
import { StartScreen } from './components/layout/StartScreen';
import { UnTangleReveal } from './components/layout/UnTangleReveal';
import { ChatThread } from './components/chat/ChatThread';
import { SummaryPage } from './components/summary/SummaryPage';
import { ClaritySnapshot } from './components/summary/ClaritySnapshot';
import { useConversationStore } from './store/conversationStore';
import { useFlowEngine } from './hooks/useFlowEngine';

// ❌ OLD SYSTEM (kept for later, NOT active now)
// import {
//   generateUntangleResponse,
//   classifySignal,
//   hasClarity,
//   extractPrimaryFeeling,
//   generateMergedReflection,
//   generateMergedDeepening,
// } from './services/responseService';

export default function App() {
  const {
    currentStep,
    addMessage,
    setTyping,
    setStep,
    untangleReveal,
    setUntangleReveal,
  } = useConversationStore();

  const { advanceStep } = useFlowEngine();

  // ✅ Safe untangle reveal (ONLY used later, not immediately)
  /*const revealUntangle = useCallback((text: string) => {
    if (!text) return;

    setTimeout(() => {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setUntangleReveal(text);
        setStep('user-untangle');
      }, 1200);
    }, 600);
  }, [setTyping, setUntangleReveal, setStep]); */

  // ✅ MAIN FLOW (FIXED)
  const handleFreeSubmit = useCallback(async (userText: string) => {
    if (!userText.trim()) return;

    addMessage({ role: 'user', text: userText });
    setTyping(true);
    setStep('user-reflection');

    try {
      const response: any = await callLLM(userText);

      setTyping(false);

      // ✅ 1. Reflection
      addMessage({
        role: 'app',
        text: response?.reflection || "Something feels off, even if it's hard to name."
      });

      // ✅ 2. Deepening (AFTER reflection, with pause)
      if (response?.deepening) {
        setTimeout(() => {
          addMessage({
            role: 'app',
            text: response.deepening
          });

          // 👉 IMPORTANT: we move step here (not untangle)
          setStep('user-deepening');

        }, 600);
      }

      // ❌ DO NOT TRIGGER UNTANGLE HERE
      // ❌ This was breaking your flow
      // if (response?.untangle) {
      //   revealUntangle(response.untangle);
      // }

    } catch (err) {
      console.error("LLM failed:", err);
      setTyping(false);

      addMessage({
        role: 'app',
        text: "Something didn’t land right. Try again."
      });
    }
  }, [addMessage, setTyping, setStep]);

  const handleUntangleSeen = () => {
    if (untangleReveal) {
      addMessage({ role: 'app', text: untangleReveal, label: 'Untangle' });
    }
    setUntangleReveal(null);
    advanceStep();
  };

  // Screens
  if (currentStep === 'summary') {
    return (
      <div style={{ position: 'fixed', inset: 0 }}>
        <BackgroundCanvas />
        <SummaryPage />
      </div>
    );
  }

  if (currentStep === 'clarity') {
    return (
      <div style={{ position: 'fixed', inset: 0 }}>
        <BackgroundCanvas />
        <ClaritySnapshot />
      </div>
    );
  }

  if (currentStep === 'start') {
    return (
      <div style={{ position: 'fixed', inset: 0 }}>
        <BackgroundCanvas />
        <StartScreen
          onFreeSubmit={handleFreeSubmit}
          onDemoSubmit={() => {
            addMessage({
              role: 'user',
              text: "I feel off and I don’t know why"
            });
            handleFreeSubmit("I feel off and I don’t know why");
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <BackgroundCanvas />

      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
        <ChatThread />

        <AnimatePresence>
          {untangleReveal && (
            <UnTangleReveal
              text={untangleReveal}
              onSeen={handleUntangleSeen}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
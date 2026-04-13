import { useCallback } from 'react';
import { callLLM } from './services/llmService';
import { AnimatePresence } from 'framer-motion';
import { BackgroundCanvas } from './components/layout/BackgroundCanvas';
import { StartScreen } from './components/layout/StartScreen';
import { UnTangleReveal } from './components/layout/UnTangleReveal';
import ChatThread  from './components/chat/ChatThread';
import { SummaryPage } from './components/summary/SummaryPage';
import { ClaritySnapshot } from './components/summary/ClaritySnapshot';
import { useConversationStore } from './store/conversationStore';
import { useFlowEngine } from './hooks/useFlowEngine';

export default function App() {
  const {
    currentStep,
    addMessage,
    setTyping,
    untangleReveal,
    setUntangleReveal,
  } = useConversationStore();

  const { advanceStep } = useFlowEngine();

  // ✅ FIXED UNTANGLE REVEAL
  const revealUntangle = useCallback((text: string) => {
    if (!text) return;

    setTimeout(() => {
      setTyping(true);

      setTimeout(() => {
        setTyping(false);
        setUntangleReveal(text);
      }, 800);

    }, 400);
  }, [setTyping, setUntangleReveal]);

  // ✅ CLEAN FLOW (NO STEP BREAKING)
  const handleFreeSubmit = useCallback(async (userText: string) => {
    if (!userText.trim()) return;

    // USER
    addMessage({ role: 'user', text: userText });
    setTyping(true);

    try {
      const response: any = await callLLM(userText);
      setTyping(false);

      // REFLECTION
      addMessage({
        role: 'app',
        text: response?.reflection || "Something feels off.",
      });

      // DEEPENING + CHIPS
      setTimeout(() => {
        addMessage({
          role: 'app',
          text: response?.deepening || "There’s something under that.",
          chips: [
            { id: 'fits', label: 'yeah… that fits' },
            { id: 'not-really', label: 'not really' },
            { id: 'something-else', label: 'something else' },
          ],
        });
      }, 400);

      // UNTANGLE (comes AFTER UI renders)
      setTimeout(() => {
        if (response?.untangle) {
          revealUntangle(response.untangle);
        }
      }, 1200);

    } catch (err) {
      console.error("LLM failed:", err);
      setTyping(false);

      addMessage({
        role: 'app',
        text: "Something didn’t land right. Try again.",
      });
    }
  }, [addMessage, setTyping, revealUntangle]);

  // ✅ FIXED: GO ON BUTTON FLOW
  const handleUntangleSeen = () => {
    if (untangleReveal) {
      addMessage({
        role: 'app',
        text: untangleReveal,
        label: 'Untangle',
      });
    }

    setUntangleReveal(null);
    advanceStep(); // move forward properly
  };

  // SCREENS
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
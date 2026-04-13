import { useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BackgroundCanvas } from './components/layout/BackgroundCanvas';
import { StartScreen } from './components/layout/StartScreen';
import { UnTangleReveal } from './components/layout/UnTangleReveal';
import ChatThread from './components/chat/ChatThread';
import { useConversationStore } from './store/conversationStore';
import { callLLM } from './services/llmService';

export default function App() {
  const {
    currentStep,
    addMessage,
    addMessageWithChips,
    setTyping,
    setStep,
    untangleReveal,
    setUntangleReveal,
  } = useConversationStore();

  const handleFreeSubmit = useCallback(async (userText: string) => {
    if (!userText.trim()) return;
  
    addMessage({
      role: 'user',
      text: userText,
    });
  
    setStep('chat');
    setTyping(true);
  
    try {
      const response: any = await callLLM(userText);
  
      // ✅ ADD HERE
      if (!response?.reflection || !response?.deepening) {
        throw new Error("LLM response incomplete");
      }
  
      setTyping(false);
  
      addMessage({
        role: 'app',
        text: response.reflection,
      });
  
      setTimeout(() => {
        addMessageWithChips(
          {
            role: 'app',
            text: response.deepening,
            chips: [
              { id: 'fits', label: 'yeah… that fits' },
              { id: 'not-really', label: 'not really' },
              { id: 'something-else', label: 'something else' },
            ],
          },
          'deepening'
        );
      }, 300);
  
    } catch (err) {
      console.error("LLM failed:", err);
      setTyping(false);
    }
  }, []);

  const handleUntangleSeen = () => {
    if (!untangleReveal) return;
  
    addMessage({
      role: 'app',
      text: untangleReveal,
    });
  
    setUntangleReveal(null);
  
    // ✅ CRITICAL: move flow forward
    setTimeout(() => {
      addMessage({
        role: 'app',
        text: "Want to go a little deeper or leave it here?",
        chips: [
          { id: 'deeper', label: 'go deeper' },
          { id: 'done', label: 'this is enough' },
        ],
      });
    }, 300);
  };

  if (currentStep === 'start') {
    return (
      <div style={{ position: 'fixed', inset: 0 }}>
        <BackgroundCanvas />
        <StartScreen 
  onFreeSubmit={handleFreeSubmit}
  onDemoSubmit={() => handleFreeSubmit("I feel off")}
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
import { useConversationStore } from './store/conversationStore';
import { useFlowController } from './hooks/useFlowController';
import BackgroundCanvas from './components/layout/BackgroundCanvas';
import { StartScreen } from './components/layout/StartScreen';
import ChatThread from './components/chat/ChatThread';
import InputBox from './components/chat/InputBox';
import { UnTangleReveal } from './components/layout/UnTangleReveal';

export default function App() {
  const messages = useConversationStore((s) => s.messages);
  const currentStep = useConversationStore((s) => s.currentStep);
  const untangleReveal = useConversationStore((s) => s.untangleReveal);

  const { handleUserInput, handleChipSelect, handleDismissUntangle } = useFlowController();

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <BackgroundCanvas />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {messages.length === 0 ? (
          <StartScreen
            onFreeSubmit={handleUserInput}
            onDemoSubmit={() => {}}
          />
        ) : (
          <ChatThread onChipSelect={handleChipSelect} />
        )}
      </div>

      {/* InputBox: visible only when currentStep === 'input' (clarification re-entry) */}
      <InputBox onSubmit={handleUserInput} />

      {/* Full-screen untangle overlay — visible during 'untangle' state only */}
      {currentStep === 'untangle' && untangleReveal && (
        <UnTangleReveal
          text={untangleReveal}
          onSeen={handleDismissUntangle}
        />
      )}
    </div>
  );
}
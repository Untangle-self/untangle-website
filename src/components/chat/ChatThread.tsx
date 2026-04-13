import { AnimatePresence } from 'framer-motion';
import { useConversationStore } from '../../store/conversationStore';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { TypingIndicator } from './TypingIndicator';
import { OptionChip } from '../controls/OptionChip';
import { callLLM } from '../../services/llmService';

export default function ChatThread() {
  const {
    messages,
    isTyping,
    lockedChipSelections,
    lockChipSelection,
    //setUntangleReveal,
  } = useConversationStore();

  const scrollRef = useAutoScroll(messages, isTyping);

  return (
    <div
      ref={scrollRef}
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '24px 20px 100px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';
        const locked = lockedChipSelections[index] || [];

        return (
          <div
            key={msg.id}
            style={{
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: isUser ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                background: isUser ? '#dbeafe' : '#ffffff',
                maxWidth: '70%',
                display: 'inline-block',
                wordBreak: 'break-word',
              }}
            >
              {msg.text}
            </div>

            {msg.chips && msg.chips.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginTop: '6px',
                }}
              >
                {msg.chips.map((chip) => {
                  const isSelected = locked.includes(chip.id);

                  return (
                    <OptionChip
                      key={chip.id}
                      label={chip.label}
                      selected={isSelected}
                      disabled={locked.length > 0}
                      onClick={async () => {
                        if (locked.length > 0) return;

                        lockChipSelection(index, [chip.id]);

                        const state = useConversationStore.getState();
                        state.setTyping(true);

                        try {
                          const res: any = await callLLM(chip.label);

                          state.setTyping(false);

                          // ✅ UNTANGLE = STOP FLOW
                          if (res?.untangle) {
                            state.setUntangleReveal(res.untangle);
                            return;
                          }

                          // ✅ ONLY continue if NO untangle
                          if (res?.deepening) {
                            state.addMessage({
                              role: 'app',
                              text: res.deepening,
                            });
                          }

                        } catch (err) {
                          console.error('LLM failed:', err);
                          state.setTyping(false);
                        }
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <AnimatePresence>
        {isTyping && <TypingIndicator key="typing" />}
      </AnimatePresence>
    </div>
  );
}
import { AnimatePresence } from 'framer-motion';
import { useConversationStore } from '../../store/conversationStore';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { TypingIndicator } from './TypingIndicator';
import { OptionChip } from '../controls/OptionChip';

export function ChatThread() {
  const { messages, isTyping } = useConversationStore();
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
      {messages.map((msg) => (
        <div key={msg.id} style={{ marginBottom: '16px' }}>

          {/* Message /}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: msg.role === 'user' ? '#dbeafe' : '#ffffff',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '70%',
              color: '#000',
            }}
          >
            {msg.text || ''}
          </div>

          {/ Chips */}
          {msg.chips && (
            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                marginTop: '6px',
              }}
            >
              {msg.chips.map((chip) => (
                <OptionChip
                  key={chip.id}
                  label={chip.label}
                  selected={false}
                  disabled={false}
                  onClick={() => {}}
                />
              ))}
            </div>
          )}

        </div>
      ))}

      <AnimatePresence>
        {isTyping && <TypingIndicator key="typing" />}
      </AnimatePresence>
    </div>
  );
}
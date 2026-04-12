import { AnimatePresence } from 'framer-motion';
import { useConversationStore } from '../../store/conversationStore';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { OptionChip } from '../controls/OptionChip';
import type { ChipAttachment } from '../../types/flow';

interface ChatThreadProps {
  chipAttachments?: Record<number, ChipAttachment>;
}

function InlineChipGroup({ options, selected, locked, onSelect }: ChipAttachment) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
      {options.map((opt) => (
        <OptionChip
          key={opt.id}
          label={opt.label}
          selected={selected.includes(opt.id)}
          disabled={locked}
          onClick={() => onSelect(opt.id)}
        />
      ))}
    </div>
  );
}

export function ChatThread({ chipAttachments = {} }: ChatThreadProps) {
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
        justifyContent: 'flex-start',
      }}
    >
      {messages.map((msg, i) => {
        const attachment = chipAttachments[i];
        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            footer={attachment ? <InlineChipGroup {...attachment} /> : undefined}
          />
        );
      })}
      <AnimatePresence>
        {isTyping && <TypingIndicator key="typing" />}
      </AnimatePresence>
    </div>
  );
}

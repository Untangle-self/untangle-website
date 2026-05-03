/**
 * ChatThread
 *
 * Render-only component. Responsibilities:
 *   - Render the message list
 *   - Show the typing indicator (left-aligned, app-side)
 *   - Handle chip UI lock (local concern)
 *   - Forward chip selections (id + label) to the flow controller via onChipSelect
 *
 * Does NOT call LLM. Does NOT make flow decisions.
 */

import { useConversationStore } from '../../store/conversationStore';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { TypingIndicator } from './TypingIndicator';
import {
  InlineUntangleCard,
  MiniUntangleCard,
  ClosureCard,
  SummaryCard,
  ChatBubble,
} from './MessageCards';

type Props = {
  onChipSelect: (chipId: string, chipLabel: string) => void;
};

export default function ChatThread({ onChipSelect }: Props) {
  const {
    messages,
    isTyping,
    lockedChipSelections,
    lockChipSelection,
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
        const msgType = msg.type ?? 'chat';
        const isCard = msgType !== 'chat';

        const selectedIds = lockedChipSelections[index] || [];
        const disabled = selectedIds.length > 0;

        const chipProps = {
          chips: msg.chips,
          selectedIds,
          disabled,
          onSelect: (value: string) => {
            if (disabled) return;
            const selectedChip = msg.chips?.find((c) => c.label === value);
            if (!selectedChip) return;
            lockChipSelection(index, [selectedChip.id]);
            onChipSelect(selectedChip.id, selectedChip.label);
          },
        };

        const card = (() => {
          switch (msgType) {
            case 'inline-untangle': return <InlineUntangleCard text={msg.text} {...chipProps} />;
            case 'mini-untangle':   return <MiniUntangleCard   text={msg.text} {...chipProps} />;
            case 'closure-card':    return <ClosureCard         text={msg.text} {...chipProps} />;
            case 'summary-card':    return <SummaryCard         text={msg.text} {...chipProps} />;
            default:                return <ChatBubble          text={msg.text} content={msg.content} isUser={isUser} {...chipProps} />;
          }
        })();

        return (
          <div
            key={msg.id}
            style={{
              marginBottom: isCard ? '24px' : '14px',
              marginTop: isCard ? '16px' : '0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: isUser ? 'flex-end' : 'flex-start',
            }}
          >
            {card}
          </div>
        );
      })}
      {isTyping && <TypingIndicator />}
    </div>
  );
}

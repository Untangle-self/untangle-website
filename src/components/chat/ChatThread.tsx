/**
 * ChatThread
 *
 * Render-only component. Responsibilities:
 *   - Render the message list
 *   - Show the typing indicator (left-aligned, app-side)
 *   - Handle chip UI lock (local concern)
 *   - Forward chip selections to the flow controller via onChipSelect
 *
 * Does NOT call LLM. Does NOT make flow decisions.
 */

import { useConversationStore } from '../../store/conversationStore';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import OptionChips from '../controls/OptionChips';

type Props = {
  onChipSelect: (label: string) => void;
};

/**
 * Parse **bold** markers into <em> elements.
 * Works on a single line of text.
 */
function renderRichLine(line: string) {
  const parts = line.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, pi) =>
    pi % 2 === 1 ? (
      <em key={pi} style={{ fontStyle: 'italic', fontWeight: 800, color: '#1A1A1A' }}>
        {part}
      </em>
    ) : (
      part
    )
  );
}

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
        const isUntangle = msg.label === 'untangle';
        const isLast = index === messages.length - 1;

        const selectedIds = lockedChipSelections[index] || [];
        const disabled = selectedIds.length > 0;

        return (
          <div
            key={msg.id}
            style={{
              marginBottom: isUntangle ? '24px' : '14px',
              marginTop: isUntangle ? '24px' : '0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: isUser ? 'flex-end' : 'flex-start',
            }}
          >
            {/* MESSAGE BUBBLE */}
            <div
              style={{
                padding: isUntangle ? '22px 24px' : '14px 16px',
                borderRadius: isUntangle ? '20px' : '16px',
                background: isUntangle ? '#F7F5EF' : isUser ? '#E2E5D5' : '#F9F8F5',
                color: isUntangle ? '#2C2C2C' : '#323232',
                maxWidth: isUntangle ? '88%' : '75%',
                wordBreak: 'break-word' as const,
                border: 'none',
                // ALL app messages use Lora for consistency
                fontFamily: isUser ? "'DM Sans', sans-serif" : "'Lora', Georgia, serif",
                fontSize: isUntangle ? '15px' : '14px',
                lineHeight: isUntangle ? '1.85' : '1.6',
                whiteSpace: 'pre-line' as const,
                // Subtle shadow for untangle visual distinction
                boxShadow: isUntangle ? '0 2px 12px rgba(140,120,90,0.08)' : 'none',
              }}
            >
              <div>
                {msg.text.split('\n').map((line, li) => (
                  <span key={li} style={{ display: 'block', minHeight: '1.2em' }}>
                    {renderRichLine(line)}
                  </span>
                ))}
              </div>

              {/* CHIPS — bare inline flex, no card wrapper */}
              {msg.chips && msg.chips.length > 0 && (
                <div
                  style={{
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(120,100,80,0.12)',
                  }}
                >
                  <OptionChips
                    options={msg.chips}
                    selectedIds={selectedIds}
                    disabled={disabled}
                    onSelect={(value: string) => {
                      if (disabled) return;
                      const selectedChip = msg.chips?.find((c) => c.label === value);
                      if (!selectedChip) return;

                      // Lock the UI — local render concern only
                      lockChipSelection(index, [selectedChip.id]);

                      // Hand off to flow controller — no logic here
                      onChipSelect(value);
                    }}
                  />
                </div>
              )}
            </div>

            {/* TYPING INDICATOR — left-aligned (app side), shown after last message only */}
            {isTyping && isLast && (
              <div
                style={{
                  marginTop: '6px',
                  padding: '12px 14px',
                  borderRadius: '16px',
                  background: '#F9F8F5',
                  display: 'flex',
                  gap: '5px',
                  alignItems: 'center',
                  width: 'fit-content',
                  alignSelf: 'flex-start',
                }}
              >
                <div className="dot" />
                <div className="dot" />
                <div className="dot" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
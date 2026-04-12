import { motion } from 'framer-motion';
import type { Message } from '../../types/flow';

interface Props {
  message: Message;
  footer?: React.ReactNode;
}

// Renders text with controlled spacing: \n\n → small gap, \n → line break, **...** → bold-italic
function InlineRichText({ text }: { text: string }) {
  const paragraphs = text.split('\n\n');
  return (
    <>
      {paragraphs.map((para, pi) => (
        <span key={pi} style={{ display: 'block', marginTop: pi === 0 ? 0 : '7px' }}>
          {para.split('\n').map((line, li) => {
            const parts = line.split(/\*\*(.*?)\*\*/g);
            return (
              <span key={li}>
                {li > 0 && <br />}
                {parts.map((part, i) =>
                  i % 2 === 1
                    ? <em key={i} style={{ fontStyle: 'italic', fontWeight: 700, color: '#1A1A1A' }}>{part}</em>
                    : part
                )}
              </span>
            );
          })}
        </span>
      ))}
    </>
  );
}

export function MessageBubble({ message, footer }: Props) {
  const isApp = message.role === 'app';
  const isUntangle = Boolean(message.label);

  if (isUntangle) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ width: '100%', marginBottom: '20px', marginTop: '8px' }}
      >
        <div style={{
          width: '100%',
          padding: '20px 22px',
          borderRadius: '16px',
          background: 'rgba(196,149,106,0.18)',
          border: '1px solid rgba(196,149,106,0.40)',
          boxShadow: '0 2px 16px rgba(180,130,60,0.10)',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '15px',
            lineHeight: '1.8',
            color: '#2C2C2C',
            fontFamily: "'Lora', Georgia, serif",
          }}>
            <InlineRichText text={message.text} />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isApp ? 'flex-start' : 'flex-end',
        marginBottom: '12px',
      }}
    >
      <div style={{
        maxWidth: isApp && footer ? '92%' : '80%',
        padding: '14px 18px',
        borderRadius: isApp ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
        background: isApp ? 'rgba(255,255,255,0.72)' : 'rgba(154,170,140,0.25)',
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
        fontSize: '15px',
        lineHeight: '1.75',
        color: '#2C2C2C',
        fontFamily: isApp ? "'Lora', Georgia, serif" : "'DM Sans', sans-serif",
      }}>
        {isApp ? <InlineRichText text={message.text} /> : message.text}
        {footer && (
          <div style={{
            marginTop: '14px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(0,0,0,0.07)',
          }}>
            {footer}
          </div>
        )}
      </div>
    </motion.div>
  );
}

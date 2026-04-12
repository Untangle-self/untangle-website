import { motion } from 'framer-motion';
import { useConversationStore } from '../../store/conversationStore';

function RichText({ text }: { text: string }) {
  const paragraphs = text.split('\n\n');
  return (
    <>
      {paragraphs.map((para, pi) => (
        <p key={pi} style={{ margin: pi === 0 ? 0 : '16px 0 0', lineHeight: '1.8' }}>
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
        </p>
      ))}
    </>
  );
}

function AmberBlock({ text }: { text: string }) {
  return (
    <div style={{
      background: 'rgba(196,149,106,0.18)',
      border: '1.5px solid rgba(196,149,106,0.40)',
      borderRadius: '18px',
      padding: '20px 22px',
      fontSize: '16px',
      color: '#2C2C2C',
      fontFamily: "'Lora', Georgia, serif",
      lineHeight: '1.8',
    }}>
      <RichText text={text} />
    </div>
  );
}

export function ClaritySnapshot() {
  const { coreUntangleText, miniUntangleText, reset } = useConversationStore();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: '40px 24px',
        paddingBottom: 'max(40px, calc(env(safe-area-inset-bottom) + 24px))',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '22px',
          fontWeight: 400,
          color: '#2C2C2C',
          margin: '0 0 28px',
          lineHeight: 1.4,
        }}
      >
        This stays with you
      </motion.h2>

      {/* Core Untangle insight */}
      {coreUntangleText ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ marginBottom: '12px' }}
        >
          <AmberBlock text={coreUntangleText} />
        </motion.div>
      ) : null}

      {/* Mini untangle / direction insight */}
      {miniUntangleText ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{ marginBottom: '28px' }}
        >
          <AmberBlock text={miniUntangleText} />
        </motion.div>
      ) : null}

      {/* Holding line */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        style={{
          fontSize: '15px',
          lineHeight: '1.85',
          color: '#5A5A5A',
          fontFamily: "'Lora', Georgia, serif",
          textAlign: 'center',
          padding: '4px 4px 24px',
        }}
      >
        You can come back to this whenever you need.
      </motion.div>

      <div style={{ flex: 1 }} />

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.9 }}
      >
        <button
          onClick={reset}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: '14px',
            border: 'none',
            background: '#7A8C6E',
            color: '#fff',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px',
            fontWeight: 500,
            cursor: 'pointer',
            letterSpacing: '0.01em',
          }}
        >
          Start something else
        </button>
      </motion.div>
    </motion.div>
  );
}

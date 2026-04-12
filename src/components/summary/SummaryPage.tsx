import { motion } from 'framer-motion';
import { useConversationStore } from '../../store/conversationStore';
import { SUMMARY_S1, SUMMARY_S2, SUMMARY_S3 } from '../../data/flowContent';

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

export function SummaryPage() {
  const { reset, setStep } = useConversationStore();

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
      {/* S1 — Clarity Note */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{
          background: 'rgba(255,255,255,0.78)',
          borderRadius: '20px',
          padding: '28px 24px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
          marginBottom: '16px',
        }}
      >
        <div style={{
          fontSize: '10px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#7A8C6E',
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 700,
          marginBottom: '16px',
        }}>
          What became clear
        </div>
        <div style={{ fontSize: '16px', color: '#2C2C2C', fontFamily: "'Lora', Georgia, serif" }}>
          <RichText text={SUMMARY_S1} />
        </div>
      </motion.div>

      {/* S2 — Acknowledgment */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
        style={{
          padding: '4px 4px',
          fontSize: '15px',
          lineHeight: '1.85',
          color: '#5A5A5A',
          fontFamily: "'Lora', Georgia, serif",
          textAlign: 'center',
        }}
      >
        {SUMMARY_S2}
      </motion.div>

      {/* S3 — Gentle Landing */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.65 }}
        style={{
          padding: '4px 4px 24px',
          fontSize: '15px',
          lineHeight: '1.85',
          color: '#5A5A5A',
          fontFamily: "'Lora', Georgia, serif",
          whiteSpace: 'pre-line',
          textAlign: 'center',
        }}
      >
        {SUMMARY_S3}
      </motion.div>

      <div style={{ flex: 1 }} />

      {/* S4 — Exit */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.85 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
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
        <button
          onClick={() => setStep('clarity')}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: '14px',
            border: '1.5px solid rgba(122,140,110,0.35)',
            background: 'rgba(255,255,255,0.5)',
            color: '#5A5A5A',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px',
            fontWeight: 400,
            cursor: 'pointer',
            letterSpacing: '0.01em',
          }}
        >
          Keep this with you
        </button>
      </motion.div>
    </motion.div>
  );
}

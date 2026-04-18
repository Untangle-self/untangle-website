import { motion } from 'framer-motion';
import { CTAButton } from '../controls/CTAButton';

interface Props {
  text: string;
  onSeen: () => void;
}

// Renders text with \n\n as paragraphs, \n as line breaks, and **...** as bold-italic
function RichText({ text }: { text: string }) {
  const paragraphs = text.split('\n\n');
  return (
    <>
      {paragraphs.map((para, i) => {
        const lines = para.split('\n');
        return (
          <p
            key={i}
            style={{
              margin: i === 0 ? 0 : '24px 0 0',
              textAlign: 'center',
              lineHeight: 1.85,
              fontSize: '18px',
              fontFamily: "'Lora', Georgia, serif",
              color: '#2C2C2C',
            }}
          >
            {lines.map((line, li) => {
              const parts = line.split(/\*\*(.*?)\*\*/g);
              return (
                <span key={li}>
                  {li > 0 && <br />}
                  {parts.map((part, pi) =>
                    pi % 2 === 1 ? (
                      <em key={pi} style={{ fontStyle: 'italic', fontWeight: 800, fontSize: '21px', color: '#1A1A1A', letterSpacing: '-0.01em' }}>
                        {part}
                      </em>
                    ) : (
                      part
                    )
                  )}
                </span>
              );
            })}
          </p>
        );
      })}
    </>
  );
}

export function UnTangleReveal({ text, onSeen }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'auto',
        zIndex: 100,
        background: 'rgba(237,230,214,0.98)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '64px 32px max(48px, calc(env(safe-area-inset-bottom) + 24px))',
      }}
    >
      {/* Top: label + text */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '420px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: 0.2 }}
          style={{ width: '100%' }}
        >
          <RichText text={text} />
        </motion.div>
      </div>

      {/* Bottom: CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        style={{ width: '100%', maxWidth: '420px' }}
      >
        <CTAButton label="Go on" onClick={onSeen} />
      </motion.div>
    </motion.div>
  );
}

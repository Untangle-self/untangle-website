import { motion } from 'framer-motion';

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.7)',
        borderRadius: '16px 16px 16px 4px',
        width: 'fit-content',
        maxWidth: '80px',
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
        marginBottom: '12px',
      }}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: '#9BAA8C',
            display: 'block',
          }}
          animate={{ y: [0, -5, 0] }}
          transition={{
            duration: 0.7,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.div>
  );
}

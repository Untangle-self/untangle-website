import { motion } from 'framer-motion';
import type { ChipOption } from '../../types/flow';
import { InlineRichText } from './MessageBubble';
import OptionChips from '../controls/OptionChips';

interface CardProps {
  text: string;
  chips?: ChipOption[];
  selectedIds: string[];
  disabled: boolean;
  onSelect: (label: string) => void;
}

interface BubbleProps extends CardProps {
  isUser: boolean;
}

function ChipsSection({ chips, selectedIds, disabled, onSelect }: Omit<CardProps, 'text'> & { align?: 'left' | 'center' }) {
  if (!chips || chips.length === 0) return null;
  return (
    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(120,100,80,0.12)' }}>
      <OptionChips options={chips} selectedIds={selectedIds} disabled={disabled} onSelect={onSelect} />
    </div>
  );
}

export function InlineUntangleCard({ text, chips, selectedIds, disabled, onSelect }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      style={{
        padding: '22px 24px',
        borderRadius: '20px',
        background: '#EAE1D1',
        maxWidth: '88%',
        fontSize: '15px',
        lineHeight: '1.9',
        fontFamily: "'Lora', Georgia, serif",
        color: '#1E1E1E',
        wordBreak: 'break-word',
        boxShadow: '0 2px 12px rgba(140,120,90,0.08)',
      }}
    >
      <InlineRichText text={text} />
      <ChipsSection chips={chips} selectedIds={selectedIds} disabled={disabled} onSelect={onSelect} />
    </motion.div>
  );
}

export function MiniUntangleCard({ text, chips, selectedIds, disabled, onSelect }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        padding: '18px 22px',
        borderRadius: '18px',
        background: '#EAE1D1',
        maxWidth: '86%',
        fontSize: '14.5px',
        lineHeight: '1.8',
        fontFamily: "'Lora', Georgia, serif",
        color: '#2C2C2C',
        wordBreak: 'break-word',
        boxShadow: '0 2px 10px rgba(140,120,90,0.07)',
      }}
    >
      <InlineRichText text={text} />
      <ChipsSection chips={chips} selectedIds={selectedIds} disabled={disabled} onSelect={onSelect} />
    </motion.div>
  );
}

export function ClosureCard({ text, chips, selectedIds, disabled, onSelect }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        padding: '20px 24px',
        borderRadius: '20px',
        background: '#F9F8F5',
        maxWidth: '84%',
        fontSize: '15px',
        lineHeight: '1.85',
        fontFamily: "'Lora', Georgia, serif",
        color: '#2C2C2C',
        wordBreak: 'break-word',
        textAlign: 'center',
        boxShadow: '0 1px 8px rgba(140,120,90,0.06)',
      }}
    >
      <InlineRichText text={text} />
      {chips && chips.length > 0 && (
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(120,100,80,0.10)', textAlign: 'left' }}>
          <OptionChips options={chips} selectedIds={selectedIds} disabled={disabled} onSelect={onSelect} />
        </div>
      )}
    </motion.div>
  );
}

export function SummaryCard({ text, chips, selectedIds, disabled, onSelect }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        padding: '20px 24px',
        borderRadius: '16px',
        background: '#EEEAE2',
        width: '100%',
        fontSize: '14px',
        lineHeight: '1.7',
        fontFamily: "'Lora', Georgia, serif",
        color: '#2C2C2C',
        wordBreak: 'break-word',
      }}
    >
      <InlineRichText text={text} />
      <ChipsSection chips={chips} selectedIds={selectedIds} disabled={disabled} onSelect={onSelect} />
    </motion.div>
  );
}

export function ChatBubble({ text, chips, selectedIds, disabled, onSelect, isUser }: BubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        padding: '14px 16px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser ? '#E2E5D5' : '#F9F8F5',
        maxWidth: '75%',
        fontSize: '14px',
        lineHeight: '1.6',
        fontFamily: isUser ? "'DM Sans', sans-serif" : "'Lora', Georgia, serif",
        color: '#323232',
        wordBreak: 'break-word',
      }}
    >
      {isUser ? (
        <span>{text}</span>
      ) : (
        <InlineRichText text={text} />
      )}
      <ChipsSection chips={chips} selectedIds={selectedIds} disabled={disabled} onSelect={onSelect} />
    </motion.div>
  );
}

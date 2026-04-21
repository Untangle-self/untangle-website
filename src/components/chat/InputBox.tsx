/**
 * InputBox
 *
 * Shown when the user taps "something else" on a deepening chip.
 * Accepts an onSubmit callback — does NOT call LLM directly.
 * The flow controller receives the text and drives the next step.
 */

import { useState } from 'react';
import { useConversationStore } from '../../store/conversationStore';

interface Props {
  onSubmit: (text: string) => void;
}

export default function InputBox({ onSubmit }: Props) {
  const currentStep = useConversationStore((s) => s.currentStep);
  const clarificationMode = useConversationStore((s) => s.clarificationMode);
  const [value, setValue] = useState('');

  if (currentStep !== 'input' || !clarificationMode) return null;

  const handleSubmit = () => {
    if (!value.trim()) return;
    const trimmed = value.trim();
    setValue('');
    onSubmit(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        width: '90%',
        maxWidth: '500px',
        display: 'flex',
        gap: '8px',
        background: '#f8f6f2',
        border: '1px solid #e7e3dc',
        padding: '8px',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Say what's actually on your mind..."
        style={{
          flex: 1,
          padding: '12px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          outline: 'none',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px',
          background: 'transparent',
        }}
      />

      <button
        onClick={handleSubmit}
        disabled={!value.trim()}
        style={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: value.trim() ? '#7A8C6E' : '#c5cfc0',
          color: '#fff',
          border: 'none',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px',
          cursor: value.trim() ? 'pointer' : 'default',
        }}
      >
        Send
      </button>
    </div>
  );
}
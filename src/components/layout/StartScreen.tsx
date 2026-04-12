import { useState, useRef } from 'react';

interface Props {
  onFreeSubmit: (text: string) => void;
  onDemoSubmit: () => void;
}

export function StartScreen({ onFreeSubmit, onDemoSubmit }: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isActive = text.trim().length > 0;

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onFreeSubmit(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '28px',
        }}
      >
        <h1
          style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: '26px',
            fontWeight: 400,
            color: '#2C2C2C',
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          We can untangle this.
        </h1>

        <div
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.55)',
            borderRadius: '16px',
            padding: '16px 18px',
            boxShadow: '0 1px 12px rgba(0,0,0,0.06)',
          }}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What feels a bit tangled right now?"
            rows={4}
            style={{
              width: '100%',
              border: 'none',
              background: 'transparent',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '16px',
              lineHeight: '1.7',
              color: '#2C2C2C',
              resize: 'none',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '8px',
            }}
          >
            <button
              onClick={handleSubmit}
              disabled={!isActive}
              style={{
                background: 'none',
                border: 'none',
                cursor: isActive ? 'pointer' : 'default',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.2s ease',
                opacity: isActive ? 1 : 0.35,
              }}
              aria-label="Send"
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="14" cy="14" r="14" fill={isActive ? '#C4956A' : '#D4B99A'} />
                <path d="M10 14h8M15 11l3 3-3 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Secondary CTA */}
        <button
          onClick={onDemoSubmit}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            color: '#9A8F82',
            letterSpacing: '0.01em',
            padding: '4px 8px',
            opacity: 0.85,
            textDecoration: 'underline',
            textDecorationColor: 'rgba(154,143,130,0.4)',
            textUnderlineOffset: '3px',
          }}
        >
          Try an example
        </button>
      </div>
    </div>
  );
}

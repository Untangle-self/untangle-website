import { useConversationStore } from '../../store/conversationStore';

export function SummaryScreen() {
  const reset = useConversationStore((s) => s.reset);
  const setCurrentView = useConversationStore((s) => s.setCurrentView);
  const untangleText = useConversationStore((s) => s.llmUntangle);
  const miniUntangleText = useConversationStore((s) => s.llmMiniUntangle);

  const handleRestart = () => {
    reset();
    setCurrentView('chat');
  };

  return (
    <div style={{ minHeight: '100vh', padding: '28px 20px 24px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 18px', fontFamily: "'Lora', Georgia, serif", color: '#2C2C2C', fontWeight: 400 }}>
          This stays with you
        </h2>

        <div style={{ display: 'grid', gap: '10px' }}>
          {untangleText ? (
            <div style={{ background: '#EEEAE2', borderRadius: '14px', padding: '16px', lineHeight: 1.8, color: '#2C2C2C' }}>
              {untangleText}
            </div>
          ) : null}
          {miniUntangleText ? (
            <div style={{ background: '#EEEAE2', borderRadius: '14px', padding: '16px', lineHeight: 1.8, color: '#2C2C2C' }}>
              {miniUntangleText}
            </div>
          ) : null}
          <p style={{ margin: '2px 0 0', color: '#5A5A5A', lineHeight: 1.7, fontFamily: "'Lora', Georgia, serif" }}>
            You can return to this whenever you need it.
          </p>
        </div>

        <button
          onClick={handleRestart}
          style={{
            marginTop: '20px',
            width: '100%',
            padding: '14px',
            borderRadius: '14px',
            border: 'none',
            background: '#7A8C6E',
            color: '#fff',
            fontSize: '15px',
            cursor: 'pointer',
          }}
        >
          Start something else
        </button>
      </div>
    </div>
  );
}

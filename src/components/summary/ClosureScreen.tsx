import { useConversationStore } from '../../store/conversationStore';

export function ClosureScreen() {
  const reset = useConversationStore((s) => s.reset);
  const setCurrentView = useConversationStore((s) => s.setCurrentView);
  const closureSummary = useConversationStore((s) => s.llmClosureSummary);

  const handleRestart = () => {
    reset();
    setCurrentView('chat');
  };

  return (
    <div style={{ minHeight: '100vh', padding: '28px 20px 24px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div
          style={{
            background: '#F9F8F5',
            borderRadius: '18px',
            padding: '22px 20px',
            boxShadow: '0 1px 8px rgba(140,120,90,0.06)',
          }}
        >
          <div style={{ fontSize: '12px', letterSpacing: '0.12em', color: '#6A6256', marginBottom: '12px' }}>
            WHAT BECAME CLEAR
          </div>
          <p style={{ margin: 0, color: '#2C2C2C', lineHeight: 1.8, fontFamily: "'Lora', Georgia, serif" }}>
            {closureSummary || 'That shift is real. You can carry it lightly from here.'}
          </p>
        </div>

        <p style={{ margin: '18px 2px 0', color: '#5A5A5A', lineHeight: 1.7, fontFamily: "'Lora', Georgia, serif" }}>
          You can leave this here, or keep one small part of it close.
        </p>

        <div style={{ display: 'grid', gap: '10px', marginTop: '18px' }}>
          <button
            onClick={handleRestart}
            style={{
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
          <button
            onClick={() => setCurrentView('summary')}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              border: '1px solid rgba(120,100,80,0.2)',
              background: '#F9F8F5',
              color: '#2C2C2C',
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            Keep this with you
          </button>
        </div>
      </div>
    </div>
  );
}

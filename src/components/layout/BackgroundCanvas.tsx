export function BackgroundCanvas() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        background: `
          radial-gradient(ellipse 80% 60% at 20% 30%, rgba(201,185,154,0.35) 0%, transparent 60%),
          radial-gradient(ellipse 60% 70% at 80% 70%, rgba(122,140,110,0.2) 0%, transparent 55%),
          radial-gradient(ellipse 90% 80% at 50% 50%, rgba(245,240,232,0.9) 0%, transparent 80%),
          #EDE6D6
        `,
      }}
    />
  );
}

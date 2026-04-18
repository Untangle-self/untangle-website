export default function BackgroundCanvas() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        background: `
          radial-gradient(circle at 20% 20%, rgba(245, 240, 232, 0.9) 0%, transparent 60%),
          radial-gradient(circle at 80% 30%, rgba(220, 200, 170, 0.35) 0%, transparent 55%),
          radial-gradient(circle at 60% 75%, rgba(210, 185, 150, 0.25) 0%, transparent 60%),
          #EDE3D6
        `,
      }}
    />
  );
}

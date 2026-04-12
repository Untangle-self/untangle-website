interface Props {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function CTAButton({ label, onClick, disabled }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '14px 24px',
        borderRadius: '999px',
        border: 'none',
        background: disabled ? '#B5C4AB' : '#7A8C6E',
        color: '#fff',
        fontSize: '15px',
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 500,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background 0.2s ease',
        marginTop: '12px',
      }}
    >
      {label}
    </button>
  );
}

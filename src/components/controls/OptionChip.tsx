interface Props {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function OptionChip({ label, selected, onClick, disabled }: Props) {
  // submitted = chosen and locked; ghosted = not chosen and locked
  const ghosted = !selected && disabled;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        padding: '9px 16px',
        borderRadius: '999px',
        border: `1.5px solid ${selected ? '#7A8C6E' : '#C9B99A'}`,
        background: selected ? 'rgba(122,140,110,0.15)' : 'rgba(255,255,255,0.65)',
        color: '#2C2C2C',
        fontSize: '14px',
        fontFamily: "'DM Sans', sans-serif",
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: ghosted ? 0.28 : 1,
      }}
    >
      {selected && (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <circle cx="6.5" cy="6.5" r="6" stroke="#7A8C6E" />
          <path
            d="M3.5 6.5l2 2 4-4"
            stroke="#7A8C6E"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {label}
    </button>
  );
}

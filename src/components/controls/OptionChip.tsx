import React from "react";

interface Props {
  option: string;
  selected: boolean;
  disabled: boolean;
  onSelect: (value: string) => void;
}

const OptionChip: React.FC<Props> = ({
  option,
  selected,
  disabled,
  onSelect,
}) => {
  return (
    <div
      onClick={() => {
        if (!disabled) onSelect(option);
      }}
      style={{
        padding: '8px 14px',
        borderRadius: '999px',
        fontSize: '13px',
        fontFamily: "'DM Sans', sans-serif",

        // ✅ refined states
        background: selected
          ? '#E2E5D5'
          : 'rgba(255, 255, 255, 0.6)',

        border: selected
          ? '1.5px solid #7E8F6C'
          : '1px solid rgba(120, 100, 80, 0.15)',

        // ✅ FIXED COLOR
        color: selected ? '#2C2C2C' : '#5A5A5A',
        fontWeight: selected ? 500 : 400,

        cursor: disabled ? 'default' : 'pointer',

        // ✅ softer disabled (not dead)
        opacity: disabled ? 0.65 : 1,

        // ✅ subtle interaction polish
        transition: 'all 0.16s ease',

        boxShadow: 'none',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {selected && (
        <span style={{ 
          marginRight: '6px', 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '14px', 
          height: '14px', 
          borderRadius: '50%', 
          border: '1px solid #7E8F6C',
          fontSize: '9px',
          color: '#7E8F6C'
        }}>
          ✓
        </span>
      )}
      {option}
    </div>
  );
};

export default OptionChip;
import React from "react";
import OptionChip from "./OptionChip";

interface Chip {
  id: string;
  label: string;
}

interface Props {
  options: Chip[];
  selectedIds: string[];
  disabled: boolean;
  onSelect: (value: string) => void;
}

const OptionChips: React.FC<Props> = ({
  options,
  selectedIds,
  disabled,
  onSelect,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      {options.map((opt) => (
        <OptionChip
          key={opt.id}
          option={opt.label}
          selected={selectedIds.includes(opt.id)}
          disabled={disabled}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};

export default OptionChips;
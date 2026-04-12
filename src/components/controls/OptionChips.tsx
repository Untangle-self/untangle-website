import { useState } from 'react';
import type { ChipOption } from '../../types/flow';
import { OptionChip } from './OptionChip';

interface Props {
  options: ChipOption[];
  multiSelect?: boolean;
  onChange: (selected: string[]) => void;
  disabled?: boolean;
}

export function OptionChips({ options, multiSelect = false, onChange, disabled }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    if (disabled) return;
    let next: string[];
    if (multiSelect) {
      next = selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id];
    } else {
      next = selected.includes(id) ? [] : [id];
    }
    setSelected(next);
    onChange(next);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
      {options.map((opt) => (
        <OptionChip
          key={opt.id}
          label={opt.label}
          selected={selected.includes(opt.id)}
          onClick={() => toggle(opt.id)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

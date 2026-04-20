export type MessageRole = 'app' | 'user';

export type Branch = 'A' | 'B' | 'C' | null;

export type A1Selection = 'pulled' | 'unseen' | 'unknown' | null;

export type PatternType = 'conflict' | 'overwhelm' | 'judgment' | 'generic';

export type FlowState =
  | 'start'
  | 'input'
  | 'reflection'
  | 'deepening_1'
  | 'alignment_choice'
  | 'deepening_2'
  | 'untangle'
  | 'post_untangle_choice'
  | 'mini_untangle'
  | 'action'
  | 'closure'
  | 'clarity';

/** @deprecated use FlowState */
export type FlowStep = FlowState;

export const VALID_TRANSITIONS: Record<FlowState, FlowState[]> = {
  start:                ['input'],
  input:                ['reflection', 'deepening_2'],
  reflection:           ['alignment_choice'],
  deepening_1:          ['deepening_2', 'input'],
  alignment_choice:     ['deepening_1', 'input'],
  deepening_2:          ['untangle'],
  untangle:             ['post_untangle_choice'],
  post_untangle_choice: ['closure', 'mini_untangle', 'action'],
  mini_untangle:        ['closure'],
  action:               ['closure'],
  closure:              [],
  clarity:              ['input'],
};

export function assertTransition(from: FlowState, to: FlowState): void {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(
      `[FlowState] Invalid transition: ${from} → ${to}. Allowed: [${allowed.join(', ')}]`
    );
  }
}

export interface ChipOption {
  id: string;
  label: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;

  // Optional UI helpers
  label?: string;

  // ✅ Chips (used by ChatThread)
  chips?: ChipOption[];
}

export type ControlConfig =
  | { type: 'chips'; options: ChipOption[]; ctaLabel: string; multiSelect?: boolean }
  | { type: 'cta-only'; ctaLabel: string }
  | { type: 'none' }
  | { type: 'summary' };

export interface ChipAttachment {
  options: ChipOption[];
  selected: string[];
  locked: boolean;
  onSelect: (id: string) => void;
}
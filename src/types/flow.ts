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
  | 'post_untangle'
  | 'mini_untangle_understand'
  | 'mini_untangle_act'
  | 'mini_untangle_hold'
  | 'decision_layer'
  | 'closure'
  | 'clarity';

/** @deprecated use FlowState */
export type FlowStep = FlowState;

export const VALID_TRANSITIONS: Record<FlowState, FlowState[]> = {
  start:                    ['input'],
  input:                    ['reflection', 'deepening_2'],
  reflection:               ['alignment_choice'],
  deepening_1:              ['deepening_2', 'input'],
  alignment_choice:         ['deepening_1', 'input'],
  deepening_2:              ['untangle'],
  untangle:                 ['post_untangle'],
  post_untangle:            ['mini_untangle_understand', 'mini_untangle_act', 'mini_untangle_hold'],
  mini_untangle_understand: ['decision_layer'],
  mini_untangle_act:        ['decision_layer'],
  mini_untangle_hold:       ['decision_layer'],
  decision_layer:           ['closure', 'deepening_2', 'mini_untangle_act'],
  closure:                  ['clarity'],
  clarity:                  ['input'],
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

export type MessageType = 'chat' | 'inline-untangle' | 'mini-untangle' | 'closure-card' | 'summary-card';

export interface Message {
  id: string;
  role: MessageRole;
  text: string;

  // Optional UI helpers
  label?: string;
  type?: MessageType;

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
export type MessageRole = 'app' | 'user';

export type Branch = 'A' | 'B' | 'C' | null;

export type A1Selection = 'pulled' | 'unseen' | 'unknown' | null;

export type PatternType = 'conflict' | 'overwhelm' | 'judgment' | 'generic';

export type FlowStep =
  | 'start'
  | 'screen1' | 'screen1b'
  | 'screen2'
  | 'screen3' | 'screen3b'
  | 'screen4'
  | 'A1' | 'A2' | 'A3'
  | 'B1' | 'B3' | 'B4'
  | 'C1' | 'C2' | 'C3' | 'C4'
  | 'user-reflection' | 'user-alignment' | 'user-deepening' | 'user-deepening-2' | 'user-untangle'
  | 'loop-nudge' | 'loop-decision'
  | 'summary'
  | 'clarity';

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  label?: string;
}

export interface ChipOption {
  id: string;
  label: string;
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

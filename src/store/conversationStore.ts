import { create } from 'zustand';
import type { Message, FlowStep, Branch, A1Selection, PatternType, ChipOption } from '../types/flow';
import type { PathAContent, PathBContent, PathCContent } from '../services/responseService';

interface ConversationState {
  messages: Message[];
  isTyping: boolean;
  currentStep: FlowStep;
  activeBranch: Branch;
  a1Selection: A1Selection;
  coreUntangleText: string;
  miniUntangleText: string;
  untangleReveal: string | null;
  // LLM response fields (populated by generateUntangleResponse)
  llmReflection: string;
  llmDeepening: string;
  llmDeepeningChips: ChipOption[] | null;
  llmUntangle: string;
  // Emotional continuity — feeling word from the first/last full-reset round
  // Used by partial alignment merge to answer "why does that feeling exist?"
  previousFeelingWord: string;
  llmPatternType: PatternType | null;
  llmPathA: PathAContent | null;
  llmPathB: PathBContent | null;
  llmPathC: PathCContent | null;
  llmAlignmentOptions: ChipOption[] | null;
  llmScreen4Options: ChipOption[] | null;
  // Stage tracking — ensures alignment is never shown more than once
  hasAligned: boolean;
  setHasAligned: (v: boolean) => void;
  // Loop tracking
  loopCount: number;
  incrementLoopCount: () => void;
  // Inline chips tracking
  activeChipsMsgIndex: number | null;
  chipStepForMsg: Record<number, string>;
  lockedChipSelections: Record<number, string[]>;

  addMessage: (msg: Omit<Message, 'id'>) => void;
  addMessageWithChips: (msg: Omit<Message, 'id'>, stepName: string) => void;
  lockChipSelection: (msgIndex: number, selected: string[]) => void;
  setTyping: (v: boolean) => void;
  setStep: (step: FlowStep) => void;
  setBranch: (branch: Branch) => void;
  setA1Selection: (sel: A1Selection) => void;
  setCoreUntangleText: (text: string) => void;
  setMiniUntangleText: (text: string) => void;
  setUntangleReveal: (text: string | null) => void;
  setLLMResponse: (r: { reflection: string; deepening: string; deepeningChips?: ChipOption[]; untangle: string; patternType: PatternType; alignmentOptions: ChipOption[]; screen4Options: ChipOption[]; pathA: PathAContent; pathB: PathBContent; pathC: PathCContent }) => void;
  setPreviousFeelingWord: (word: string) => void;
  reset: () => void;
}

const initialState = {
  messages: [] as Message[],
  isTyping: false,
  currentStep: 'start' as FlowStep,
  activeBranch: null as Branch,
  a1Selection: null as A1Selection,
  coreUntangleText: '',
  miniUntangleText: '',
  untangleReveal: null as string | null,
  llmReflection: '',
  llmDeepening: '',
  llmDeepeningChips: null as ChipOption[] | null,
  llmUntangle: '',
  previousFeelingWord: '',
  llmPatternType: null as PatternType | null,
  llmPathA: null as PathAContent | null,
  llmPathB: null as PathBContent | null,
  llmPathC: null as PathCContent | null,
  llmAlignmentOptions: null as ChipOption[] | null,
  llmScreen4Options: null as ChipOption[] | null,
  hasAligned: false,
  loopCount: 0,
  activeChipsMsgIndex: null as number | null,
  chipStepForMsg: {} as Record<number, string>,
  lockedChipSelections: {} as Record<number, string[]>,
};

export const useConversationStore = create<ConversationState>((set) => ({
  ...initialState,

  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, { ...msg, id: `${Date.now()}-${Math.random()}` }],
  })),

  // Adds a message and records that it should show inline chips for the given step
  addMessageWithChips: (msg, stepName) => set((state) => ({
    messages: [...state.messages, { ...msg, id: `${Date.now()}-${Math.random()}` }],
    activeChipsMsgIndex: state.messages.length,
    chipStepForMsg: { ...state.chipStepForMsg, [state.messages.length]: stepName },
  })),

  // Locks a chip selection so it persists after the step advances
  lockChipSelection: (msgIndex, selected) => set((state) => ({
    lockedChipSelections: { ...state.lockedChipSelections, [msgIndex]: selected },
  })),

  setHasAligned: (v) => set({ hasAligned: v }),
  incrementLoopCount: () => set((state) => ({ loopCount: state.loopCount + 1 })),
  setTyping: (v) => set({ isTyping: v }),
  setStep: (step) => set({ currentStep: step }),
  setBranch: (branch) => set({ activeBranch: branch }),
  setA1Selection: (sel) => set({ a1Selection: sel }),
  setCoreUntangleText: (text) => set({ coreUntangleText: text }),
  setMiniUntangleText: (text) => set({ miniUntangleText: text }),
  setUntangleReveal: (text) => set({ untangleReveal: text }),
  setLLMResponse: (r) => set({ llmReflection: r.reflection, llmDeepening: r.deepening, llmDeepeningChips: r.deepeningChips ?? null, llmUntangle: r.untangle, llmPatternType: r.patternType, llmAlignmentOptions: r.alignmentOptions, llmScreen4Options: r.screen4Options, llmPathA: r.pathA, llmPathB: r.pathB, llmPathC: r.pathC }),
  setPreviousFeelingWord: (word) => set({ previousFeelingWord: word }),
  reset: () => set(initialState),
}));

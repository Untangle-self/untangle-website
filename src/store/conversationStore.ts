import { create } from 'zustand';
import type { Message, FlowStep, Branch, A1Selection, PatternType, ChipOption } from '../types/flow';
import type { PathAContent, PathBContent, PathCContent } from '../services/responseService.ts';

interface ConversationState {
  messages: Message[];
  isTyping: boolean;
  currentStep: FlowStep;
  activeBranch: Branch;
  a1Selection: A1Selection;
  coreUntangleText: string;
  miniUntangleText: string;
  untangleReveal: string | null;

  llmReflection: string;
  llmDeepening: string;
  llmDeepeningChips: ChipOption[] | null;
  llmUntangle: string;

  previousFeelingWord: string;

  llmPatternType: PatternType | null;
  llmPathA: PathAContent | null;
  llmPathB: PathBContent | null;
  llmPathC: PathCContent | null;

  llmAlignmentOptions: ChipOption[] | null;
  llmScreen4Options: ChipOption[] | null;

  hasAligned: boolean;
  setHasAligned: (v: boolean) => void;

  loopCount: number;
  incrementLoopCount: () => void;

  activeChipsMsgIndex: number | null;
  setActiveChipsMsgIndex: (index: number) => void;

  chipStepForMsg: Record<number, string>;
  lockedChipSelections: Record<number, string[]>;

  addMessage: (msg: Omit<Message, 'id'>) => void;
  addMessageWithChips: (msg: Omit<Message, 'id'>, stepName: string) => number;
  lockChipSelection: (msgIndex: number, selected: string[]) => void;

  setTyping: (v: boolean) => void;
  setStep: (step: FlowStep) => void;
  setBranch: (branch: Branch) => void;
  setA1Selection: (sel: A1Selection) => void;
  setCoreUntangleText: (text: string) => void;
  setMiniUntangleText: (text: string) => void;
  setUntangleReveal: (text: string | null) => void;

  setLLMResponse: (r: {
    reflection: string;
    deepening: string;
    deepeningChips?: ChipOption[];
    untangle: string;
    patternType: PatternType;
    alignmentOptions: ChipOption[];
    screen4Options: ChipOption[];
    pathA: PathAContent;
    pathB: PathBContent;
    pathC: PathCContent;
  }) => void;

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

  // ✅ FIXED: stable + safe message creation
  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(), // ✅ stable React key
          role: msg.role,
          text: msg.text,
          label: msg.label,
          chips: msg.chips ?? undefined, // ✅ ensure consistency
        },
      ],
    })),

  // ✅ FIXED: chips + index tracking
  addMessageWithChips: (msg, stepName) => {
    let index = 0;

    set((state) => {
      index = state.messages.length;

      return {
        messages: [
          ...state.messages,
          {
            id: crypto.randomUUID(),
            role: msg.role,
            text: msg.text,
            label: msg.label,
            chips: msg.chips ?? [],
          },
        ],
        activeChipsMsgIndex: index,
        chipStepForMsg: {
          ...state.chipStepForMsg,
          [index]: stepName,
        },
      };
    });

    return index;
  },

  lockChipSelection: (msgIndex, selected) =>
    set((state) => ({
      lockedChipSelections: {
        ...state.lockedChipSelections,
        [msgIndex]: selected,
      },
    })),

  setActiveChipsMsgIndex: (index: number) =>
    set(() => ({
      activeChipsMsgIndex: index,
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

  setLLMResponse: (r) =>
    set({
      llmReflection: r.reflection,
      llmDeepening: r.deepening,
      llmDeepeningChips: r.deepeningChips ?? null,
      llmUntangle: r.untangle,
      llmPatternType: r.patternType,
      llmAlignmentOptions: r.alignmentOptions,
      llmScreen4Options: r.screen4Options,
      llmPathA: r.pathA,
      llmPathB: r.pathB,
      llmPathC: r.pathC,
    }),

  setPreviousFeelingWord: (word) => set({ previousFeelingWord: word }),

  reset: () => set(initialState),
}));
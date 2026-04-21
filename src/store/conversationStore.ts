import { create } from 'zustand';
import type { Message, FlowState, Branch, A1Selection } from '../types/flow';

interface ConversationState {
  messages: Message[];
  isTyping: boolean;

  currentStep: FlowState;
  activeBranch: Branch;
  a1Selection: A1Selection;

  untangleReveal: string | null;

  clarificationMode: boolean;
  dynamicAlignmentOptions: string[];

  llmReflection: string;
  llmDeepening: string;
  llmDeepening2: string;
  llmUntangle: string;
  llmMiniUntangle: string;
  llmClosureSummary: string;

  lockedChipSelections: Record<number, string[]>;
  activeChipsMsgIndex: number | null;

  loopCount: number;
  currentView: 'chat' | 'closure' | 'summary';

  // actions
  addMessage: (msg: Omit<Message, 'id'>) => void;
  lockChipSelection: (msgIndex: number, selected: string[]) => void;

  setTyping: (v: boolean) => void;
  setUntangleReveal: (text: string | null) => void;

  setClarificationMode: (v: boolean) => void;
  setDynamicAlignmentOptions: (opts: string[]) => void;

  setStep: (step: FlowState) => void;
  setLLMContent: (reflection: string, deepening: string, deepening2: string, untangle: string, miniUntangle: string, closureSummary: string) => void;

  incrementLoopCount: () => void;
  setCurrentView: (view: 'chat' | 'closure' | 'summary') => void;
  reset: () => void;
}

const initialState = {
  messages: [],
  isTyping: false,

  currentStep: 'start' as FlowState,
  activeBranch: null as Branch,
  a1Selection: null as A1Selection,

  untangleReveal: null,

  clarificationMode: false,
  dynamicAlignmentOptions: [] as string[],

  llmReflection: '',
  llmDeepening: '',
  llmDeepening2: '',
  llmUntangle: '',
  llmMiniUntangle: '',
  llmClosureSummary: '',

  lockedChipSelections: {},
  activeChipsMsgIndex: null,

  loopCount: 0,
  currentView: 'chat' as 'chat' | 'closure' | 'summary',
};

export const useConversationStore = create<ConversationState>((set) => ({
  ...initialState,

  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role: msg.role,
          text: msg.text,
          label: msg.label,
          type: msg.type,
          chips: msg.chips ?? undefined,
        },
      ],
    })),

  lockChipSelection: (msgIndex, selected) =>
    set((state) => ({
      lockedChipSelections: {
        ...state.lockedChipSelections,
        [msgIndex]: selected,
      },
    })),

  setTyping: (v) => set({ isTyping: v }),

  setUntangleReveal: (text) =>
    set({
      untangleReveal: text,
      isTyping: false,
    }),

  setClarificationMode: (v) => set({ clarificationMode: v }),
  setDynamicAlignmentOptions: (opts) => set({ dynamicAlignmentOptions: opts }),

  setStep: (step) => set({ currentStep: step }),

  setLLMContent: (reflection, deepening, deepening2, untangle, miniUntangle, closureSummary) =>
    set({ llmReflection: reflection, llmDeepening: deepening, llmDeepening2: deepening2, llmUntangle: untangle, llmMiniUntangle: miniUntangle, llmClosureSummary: closureSummary }),

  incrementLoopCount: () =>
    set((state) => ({
      loopCount: state.loopCount + 1,
    })),

  setCurrentView: (view) => set({ currentView: view }),

  reset: () => set(initialState),
}));

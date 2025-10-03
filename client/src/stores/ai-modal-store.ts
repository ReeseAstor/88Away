import { create } from 'zustand';

interface AiModalStore {
  isOpen: boolean;
  prefillData: {
    persona: "muse" | "editor" | "coach" | null;
    prompt: string;
    projectId?: string;
  } | null;
  openWithPrompt: (data: { persona: "muse" | "editor" | "coach" | null; prompt: string; projectId?: string }) => void;
  close: () => void;
  clearPrefill: () => void;
}

export const useAiModalStore = create<AiModalStore>((set) => ({
  isOpen: false,
  prefillData: null,
  openWithPrompt: (data) => set({ isOpen: true, prefillData: data }),
  close: () => set({ isOpen: false }),
  clearPrefill: () => set({ prefillData: null }),
}));

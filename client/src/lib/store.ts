import { create } from 'zustand';

interface AppState {
  currentProject: string | null;
  sidebarCollapsed: boolean;
  aiSessionCount: number;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentProject: (projectId: string | null) => void;
  incrementAiSession: () => void;
}

export const useStore = create<AppState>((set) => ({
  currentProject: null,
  sidebarCollapsed: false,
  aiSessionCount: 0,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setCurrentProject: (projectId) => set({ currentProject: projectId }),
  incrementAiSession: () => set((state) => ({ aiSessionCount: state.aiSessionCount + 1 })),
}));

import { create } from 'zustand';

interface AppState {
  currentProject: string | null;
  sidebarCollapsed: boolean;
  aiSessionCount: number;
  currentBranch: string | null;
  currentDocumentId: string | null;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentProject: (projectId: string | null) => void;
  incrementAiSession: () => void;
  setCurrentBranch: (branchId: string | null) => void;
  setCurrentDocumentId: (documentId: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  currentProject: null,
  sidebarCollapsed: false,
  aiSessionCount: 0,
  currentBranch: null,
  currentDocumentId: null,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setCurrentProject: (projectId) => set({ currentProject: projectId }),
  incrementAiSession: () => set((state) => ({ aiSessionCount: state.aiSessionCount + 1 })),
  setCurrentBranch: (branchId) => set({ currentBranch: branchId }),
  setCurrentDocumentId: (documentId) => set({ currentDocumentId: documentId }),
}));

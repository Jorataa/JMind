import { create } from "zustand";

interface UIState {
  sidebarCollapsed: boolean;
  // Actions
  actions: {
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
  };
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  actions: {
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
  },
}));

export const useUIActions = () => useUIStore((state) => state.actions);

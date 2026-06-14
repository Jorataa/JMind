import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  commandPaletteOpen: boolean;
  quickCaptureOpen: boolean;
  userName: string;
  // Actions
  actions: {
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    toggleMobileSidebar: () => void;
    setMobileSidebarOpen: (open: boolean) => void;
    toggleCommandPalette: () => void;
    setCommandPaletteOpen: (open: boolean) => void;
    toggleQuickCapture: () => void;
    setQuickCaptureOpen: (open: boolean) => void;
    setUserName: (name: string) => void;
  };
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      commandPaletteOpen: false,
      quickCaptureOpen: false,
      userName: "Jovan",
      actions: {
        toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
        toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
        setMobileSidebarOpen: (open: boolean) => set({ mobileSidebarOpen: open }),
        toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
        setCommandPaletteOpen: (open: boolean) => set({ commandPaletteOpen: open }),
        toggleQuickCapture: () => set((state) => ({ quickCaptureOpen: !state.quickCaptureOpen })),
        setQuickCaptureOpen: (open: boolean) => set({ quickCaptureOpen: open }),
        setUserName: (name: string) => set({ userName: name }),
      },
    }),
    {
      name: "jmind:ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        userName: state.userName,
      }),
    }
  )
);

export const useUIActions = () => useUIStore((state) => state.actions);
export const useUserName = () => useUIStore((state) => state.userName);

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  commandPaletteOpen: boolean;
  quickCaptureOpen: boolean;
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
  };
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      commandPaletteOpen: false,
      quickCaptureOpen: false,
      actions: {
        toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
        toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
        setMobileSidebarOpen: (open: boolean) => set({ mobileSidebarOpen: open }),
        toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
        setCommandPaletteOpen: (open: boolean) => set({ commandPaletteOpen: open }),
        toggleQuickCapture: () => set((state) => ({ quickCaptureOpen: !state.quickCaptureOpen })),
        setQuickCaptureOpen: (open: boolean) => set({ quickCaptureOpen: open }),
      },
    }),
    {
      name: "jmind:ui",
      partialize: (state) => ({ 
        sidebarCollapsed: state.sidebarCollapsed 
      }),
    }
  )
);

export const useUIActions = () => useUIStore((state) => state.actions);

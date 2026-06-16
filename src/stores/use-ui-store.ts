import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  commandPaletteOpen: boolean;
  quickCaptureOpen: boolean;
  userName: string;
  // True once the visitor has told us their name via the welcome gate. Kept
  // separate from `userName` so a blank/edited name never re-triggers the gate.
  hasOnboarded: boolean;
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
    // Save the name from the welcome gate and mark onboarding done.
    completeOnboarding: (name: string) => void;
  };
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      commandPaletteOpen: false,
      quickCaptureOpen: false,
      // Empty by default — the welcome gate fills this in on first visit.
      userName: "",
      hasOnboarded: false,
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
        completeOnboarding: (name: string) =>
          set({ userName: name.trim(), hasOnboarded: true }),
      },
    }),
    {
      name: "jmind:ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        userName: state.userName,
        hasOnboarded: state.hasOnboarded,
      }),
    }
  )
);

export const useUIActions = () => useUIStore((state) => state.actions);
export const useUserName = () => useUIStore((state) => state.userName);
export const useHasOnboarded = () => useUIStore((state) => state.hasOnboarded);

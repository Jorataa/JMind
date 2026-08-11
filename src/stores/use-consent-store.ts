import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CookiePreferencesState {
  /** Essential local storage (theme, workspace data, security) - always true */
  essential: true;
  /** Custom UI preferences (wisdom strip, sidebar state) */
  preferences: boolean;
  /** Anonymous visitor telemetry / logs */
  analytics: boolean;
  /** Whether the user has made an explicit choice or dismissed the banner */
  hasResponded: boolean;
  actions: {
    acceptAll: () => void;
    rejectNonEssential: () => void;
    setPreferences: (opts: { preferences?: boolean; analytics?: boolean }) => void;
    resetConsent: () => void;
  };
}

export const useConsentStore = create<CookiePreferencesState>()(
  persist(
    (set) => ({
      essential: true,
      preferences: true,
      analytics: true,
      hasResponded: false,
      actions: {
        acceptAll: () =>
          set({
            essential: true,
            preferences: true,
            analytics: true,
            hasResponded: true,
          }),
        rejectNonEssential: () =>
          set({
            essential: true,
            preferences: false,
            analytics: false,
            hasResponded: true,
          }),
        setPreferences: (opts) =>
          set((state) => ({
            preferences: opts.preferences ?? state.preferences,
            analytics: opts.analytics ?? state.analytics,
            hasResponded: true,
          })),
        resetConsent: () =>
          set({
            essential: true,
            preferences: true,
            analytics: true,
            hasResponded: false,
          }),
      },
    }),
    {
      name: "jmind:cookie-consent",
      partialize: (state) => ({
        preferences: state.preferences,
        analytics: state.analytics,
        hasResponded: state.hasResponded,
      }),
    }
  )
);

export const useConsentActions = () => useConsentStore((state) => state.actions);
export const useAnalyticsAllowed = () =>
  useConsentStore((state) => !state.hasResponded || state.analytics);

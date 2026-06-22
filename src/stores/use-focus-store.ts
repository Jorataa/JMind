import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

interface FocusState {
  dailyAnchor: string | null;
  anchorCompleted: boolean;
  deepWorkMode: boolean;
  deepWorkStartedAt: string | null;
  activeTaskId: string | null;
  lastResetAt: string | null;
  lastReflectionAt: string | null;

  actions: {
    setDailyAnchor: (anchor: string | null) => void;
    toggleAnchorCompleted: () => void;
    setDeepWorkMode: (active: boolean) => void;
    setActiveTask: (id: string | null) => void;
    resetDaily: () => void;
    checkNewDay: () => boolean;
    logReflection: (content: string) => void;
  };
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      dailyAnchor: null,
      anchorCompleted: false,
      deepWorkMode: false,
      deepWorkStartedAt: null,
      activeTaskId: null,
      lastResetAt: new Date().toISOString(),
      lastReflectionAt: null,

      actions: {
        setDailyAnchor: (anchor) => set({ 
          dailyAnchor: anchor, 
          anchorCompleted: false,
          lastResetAt: new Date().toISOString()
        }),
        toggleAnchorCompleted: () => set((state) => ({ anchorCompleted: !state.anchorCompleted })),
        setDeepWorkMode: (active) => set((state) => ({
          deepWorkMode: active,
          deepWorkStartedAt: active
            ? state.deepWorkStartedAt ?? new Date().toISOString()
            : null,
        })),
        setActiveTask: (id) => set({ activeTaskId: id }),
        resetDaily: () => set({ 
          dailyAnchor: null, 
          anchorCompleted: false, 
          activeTaskId: null,
          deepWorkMode: false,
          deepWorkStartedAt: null,
          lastResetAt: new Date().toISOString()
        }),
        checkNewDay: () => {
          const { lastResetAt } = get();
          if (!lastResetAt) return false;

          const lastDate = new Date(lastResetAt).toDateString();
          const today = new Date().toDateString();

          if (lastDate !== today) {
            return true;
          }
          return false;
        },
        logReflection: (content) => {
          set({ lastReflectionAt: new Date().toISOString() });
          // Log to activity store
          import('./use-activity-store').then((m) => {
            m.useActivityStore.getState().actions.logActivity(
              'mindset_reflection',
              `Daily Reflection: ${content.substring(0, 50)}...`,
              { content }
            );
          });
        }
      },
    }),
    {
      name: 'jmind:focus',
      // Persist only data — never the actions. Older builds serialized the whole
      // state, and JSON.stringify turns the actions object into {} (functions are
      // dropped). On reload the default merge then clobbered the real actions with
      // that empty object, so callers like useSessionContinuity hit
      // "checkNewDay is not a function" and the dashboard crashed.
      partialize: (state) => ({
        dailyAnchor: state.dailyAnchor,
        anchorCompleted: state.anchorCompleted,
        deepWorkMode: state.deepWorkMode,
        deepWorkStartedAt: state.deepWorkStartedAt,
        activeTaskId: state.activeTaskId,
        lastResetAt: state.lastResetAt,
        lastReflectionAt: state.lastReflectionAt,
      }),
      // Force actions to come from the live store, healing any already-persisted
      // blob that still carries an empty actions object from an older build.
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<FocusState>),
        actions: current.actions,
      }),
    }
  )
);
// useShallow keeps the selector snapshot referentially stable — zustand v5
// treats the selector result as React's getSnapshot, so a fresh object literal
// here causes an infinite render loop.
export const useFocus = () =>
  useFocusStore(
    useShallow((state) => ({
      dailyAnchor: state.dailyAnchor,
      anchorCompleted: state.anchorCompleted,
      deepWorkMode: state.deepWorkMode,
      deepWorkStartedAt: state.deepWorkStartedAt,
      activeTaskId: state.activeTaskId,
      lastResetAt: state.lastResetAt,
    }))
  );

export const useFocusActions = () => useFocusStore((state) => state.actions);

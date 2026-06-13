import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Activity, ActivityType } from '@/types/activity';

interface ActivityState {
  activities: Activity[];
  actions: {
    logActivity: (type: ActivityType, label: string, metadata?: Record<string, unknown>) => void;
    clearActivities: () => void;
  };
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      activities: [],
      actions: {
        logActivity: (type, label, metadata) => {
          const newActivity: Activity = {
            id: crypto.randomUUID(),
            type,
            label,
            timestamp: new Date().toISOString(),
            metadata,
          };

          set((state) => ({
            activities: [newActivity, ...state.activities].slice(0, 50),
          }));
        },
        clearActivities: () => set({ activities: [] }),
      },
    }),
    {
      name: 'jmind:activity',
      partialize: (state) => ({ activities: state.activities }),
    }
  )
);

export const useActivities = () => useActivityStore((state) => state.activities);
export const useActivityActions = () => useActivityStore((state) => state.actions);

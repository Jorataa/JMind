import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Activity, ActivityType } from '@/types/activity';

const validTypes = new Set<ActivityType>([
  'task_created',
  'task_completed',
  'task_uncompleted',
  'node_created',
  'node_converted',
  'kpi_updated',
  'mindset_reflection',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// The feed renders timestamps and type icons directly, so a single malformed
// entry from older or corrupted storage would crash the dashboard. Drop anything
// we can't trust rather than render it.
const sanitizeActivities = (activities: unknown): Activity[] => {
  const list = Array.isArray(activities) ? activities : [];
  const clean: Activity[] = [];

  for (const entry of list) {
    if (!isRecord(entry)) continue;
    if (typeof entry.id !== 'string' || entry.id.length === 0) continue;
    if (typeof entry.type !== 'string' || !validTypes.has(entry.type as ActivityType)) continue;
    if (typeof entry.label !== 'string') continue;
    if (typeof entry.timestamp !== 'string' || Number.isNaN(Date.parse(entry.timestamp))) continue;

    clean.push({
      id: entry.id,
      type: entry.type as ActivityType,
      label: entry.label,
      timestamp: entry.timestamp,
      metadata: isRecord(entry.metadata) ? entry.metadata : undefined,
    });

    if (clean.length >= 50) break;
  }

  return clean;
};

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
      partialize: (state) => ({ activities: sanitizeActivities(state.activities) }),
      merge: (persisted, current) => ({
        ...current,
        activities: sanitizeActivities((persisted as Partial<ActivityState>)?.activities),
        actions: current.actions,
      }),
    }
  )
);

export const useActivities = () => useActivityStore((state) => state.activities);
export const useActivityActions = () => useActivityStore((state) => state.actions);

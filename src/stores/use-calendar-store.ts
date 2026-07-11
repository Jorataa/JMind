import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Calendar events (design handoff §7, §12). Two kinds:
 *  - "event": a normal commitment (meeting, deadline)
 *  - "hold":  a dashed reserved block ("Hold for writing")
 * Tasks with due dates render alongside these but live in the task store.
 */
export type CalendarEventType = "event" | "hold";

export interface CalendarEvent {
  id: string;
  title: string;
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  /** Optional start time "HH:mm" (24h). All-day when absent. */
  start?: string;
  /** Duration in minutes when start is set. */
  durationMin?: number;
  type: CalendarEventType;
  note?: string;
  createdAt: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sanitizeEvent = (value: unknown): CalendarEvent | null => {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || !value.id) return null;
  if (typeof value.title !== "string" || !value.title.trim()) return null;
  if (typeof value.date !== "string" || !DATE_RE.test(value.date)) return null;

  return {
    id: value.id,
    title: value.title.trim(),
    date: value.date,
    start:
      typeof value.start === "string" && TIME_RE.test(value.start)
        ? value.start
        : undefined,
    durationMin:
      typeof value.durationMin === "number" &&
      Number.isFinite(value.durationMin) &&
      value.durationMin > 0
        ? Math.min(value.durationMin, 24 * 60)
        : undefined,
    type: value.type === "hold" ? "hold" : "event",
    note: typeof value.note === "string" && value.note ? value.note : undefined,
    createdAt:
      typeof value.createdAt === "string" && !Number.isNaN(Date.parse(value.createdAt))
        ? value.createdAt
        : new Date().toISOString(),
  };
};

const sanitizeEvents = (events: unknown): CalendarEvent[] => {
  const seen = new Set<string>();
  return (Array.isArray(events) ? events : [])
    .map(sanitizeEvent)
    .filter((event): event is CalendarEvent => event !== null)
    .filter((event) => {
      if (seen.has(event.id)) return false;
      seen.add(event.id);
      return true;
    });
};

interface CalendarState {
  events: CalendarEvent[];
  actions: {
    addEvent: (
      event: Omit<CalendarEvent, "id" | "createdAt"> & { id?: string }
    ) => CalendarEvent;
    updateEvent: (
      id: string,
      updates: Partial<Omit<CalendarEvent, "id" | "createdAt">>
    ) => void;
    removeEvent: (id: string) => void;
  };
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      events: [],
      actions: {
        addEvent: (event) => {
          const created: CalendarEvent = {
            ...event,
            id: event.id ?? crypto.randomUUID(),
            title: event.title.trim() || "Untitled",
            createdAt: new Date().toISOString(),
          };
          set((state) => ({ events: [created, ...state.events] }));
          return created;
        },
        updateEvent: (id, updates) =>
          set((state) => ({
            events: state.events.map((event) =>
              event.id === id ? { ...event, ...updates } : event
            ),
          })),
        removeEvent: (id) =>
          set((state) => ({
            events: state.events.filter((event) => event.id !== id),
          })),
      },
    }),
    {
      name: "jmind:calendar",
      partialize: (state) => ({ events: sanitizeEvents(state.events) }),
      merge: (persisted, current) => ({
        ...current,
        events: sanitizeEvents((persisted as Partial<CalendarState>)?.events),
        actions: current.actions,
      }),
    }
  )
);

export const useCalendarEvents = () => useCalendarStore((state) => state.events);
export const useCalendarActions = () => useCalendarStore((state) => state.actions);

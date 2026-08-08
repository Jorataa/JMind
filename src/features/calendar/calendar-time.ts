import type { CalendarEvent } from "@/stores/use-calendar-store";

/** Vertical scale of the time grid — one hour of the day in pixels. */
export const HOUR_PX = 48;
/** Snap for click-create, drag-move and resize. */
export const SNAP_MIN = 15;
export const DAY_MIN = 24 * 60;
export const DEFAULT_DURATION_MIN = 60;

export const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const toHHMM = (minutes: number): string => {
  const clamped = Math.max(0, Math.min(DAY_MIN - 1, Math.round(minutes)));
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(
    clamped % 60
  ).padStart(2, "0")}`;
};

/** 570 → "9:30 AM" · 540 → "9 AM" — calm 12-hour labels for mono numerals. */
export const formatMinutes = (minutes: number): string => {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const h12 = ((h + 11) % 12) + 1;
  const suffix = h < 12 ? "AM" : "PM";
  return m ? `${h12}:${String(m).padStart(2, "0")} ${suffix}` : `${h12} ${suffix}`;
};

export const addDays = (date: Date, days: number): Date => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
};

export const mondayOf = (date: Date): Date => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};

export interface PositionedEvent {
  event: CalendarEvent;
  startMin: number;
  endMin: number;
  /** Horizontal slot when events overlap: left = col/cols, width = 1/cols. */
  col: number;
  cols: number;
}

/**
 * Google-style overlap layout: events that overlap in time share the column
 * width. Greedy column assignment inside each overlapping cluster.
 */
export function layoutDayEvents(events: CalendarEvent[]): PositionedEvent[] {
  const timed = events
    .filter((e) => e.start)
    .map((event) => {
      const startMin = toMinutes(event.start!);
      const endMin = Math.min(
        DAY_MIN,
        startMin + Math.max(SNAP_MIN, event.durationMin ?? DEFAULT_DURATION_MIN)
      );
      return { event, startMin, endMin, col: 0, cols: 1 };
    })
    .sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);

  let cluster: PositionedEvent[] = [];
  let columnEnds: number[] = [];
  let clusterMaxEnd = -1;

  const closeCluster = () => {
    const cols = columnEnds.length || 1;
    cluster.forEach((p) => (p.cols = cols));
    cluster = [];
    columnEnds = [];
    clusterMaxEnd = -1;
  };

  for (const positioned of timed) {
    if (positioned.startMin >= clusterMaxEnd && cluster.length > 0) {
      closeCluster();
    }
    // First column whose last event has ended; otherwise open a new one.
    let col = columnEnds.findIndex((end) => end <= positioned.startMin);
    if (col === -1) {
      col = columnEnds.length;
      columnEnds.push(positioned.endMin);
    } else {
      columnEnds[col] = positioned.endMin;
    }
    positioned.col = col;
    cluster.push(positioned);
    clusterMaxEnd = Math.max(clusterMaxEnd, positioned.endMin);
  }
  closeCluster();

  return timed;
}

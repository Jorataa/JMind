"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CalendarEvent } from "@/stores/use-calendar-store";
import type { Task } from "@/types/tasks";
import { getLocalDateKey } from "@/lib/format-date";
import { cn } from "@/lib/cn";
import { CheckSquare } from "lucide-react";
import {
  HOUR_PX,
  SNAP_MIN,
  DAY_MIN,
  toHHMM,
  formatMinutes,
  layoutDayEvents,
} from "./calendar-time";

/**
 * The time grid (design pass 2): a real week — hour gutter, snap-to-15-minute
 * blocks, a clay "now" line, click-any-slot to create, drag to move, drag the
 * bottom edge to resize. All-day events and dated tasks live in a lane above
 * the hours so the grid itself stays precise.
 */

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"]; // Date.getDay() order
const GUTTER_PX = 56;

interface DragState {
  id: string;
  startMin: number;
  durationMin: number;
  dayDelta: number;
  colWidth: number;
  mode: "move" | "resize";
}

export default function WeekGrid({
  days,
  events,
  tasks,
  showEmptyHint,
  onCreateAt,
  onEdit,
  onReschedule,
}: {
  days: Date[];
  events: CalendarEvent[];
  tasks: Task[];
  showEmptyHint: boolean;
  onCreateAt: (date: string, start?: string) => void;
  onEdit: (event: CalendarEvent) => void;
  onReschedule: (
    id: string,
    updates: { date?: string; start?: string; durationMin?: number }
  ) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dayKeys = useMemo(() => days.map((d) => getLocalDateKey(d)), [days]);
  const todayKey = getLocalDateKey();

  // The clay now-line, updated each minute.
  const [nowMin, setNowMin] = useState(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setNowMin(n.getHours() * 60 + n.getMinutes());
    };
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // Land the viewport on the working morning, not midnight.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 7.5 * HOUR_PX });
  }, []);

  const { timedByDay, allDayByDay, tasksByDay } = useMemo(() => {
    const timedByDay = new Map<string, CalendarEvent[]>();
    const allDayByDay = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const bucket = event.start ? timedByDay : allDayByDay;
      const list = bucket.get(event.date) ?? [];
      list.push(event);
      bucket.set(event.date, list);
    }
    const tasksByDay = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const key = getLocalDateKey(new Date(task.dueDate));
      const list = tasksByDay.get(key) ?? [];
      list.push(task);
      tasksByDay.set(key, list);
    }
    return { timedByDay, allDayByDay, tasksByDay };
  }, [events, tasks]);

  const hasAllDayLane =
    dayKeys.some((key) => (allDayByDay.get(key)?.length ?? 0) > 0) ||
    dayKeys.some((key) => (tasksByDay.get(key)?.length ?? 0) > 0);

  const gridTemplateColumns = `${GUTTER_PX}px repeat(${days.length}, minmax(0, 1fr))`;
  const minWidth = days.length === 1 ? 340 : GUTTER_PX + days.length * 100;

  return (
    <div className="overflow-x-auto rounded-card border border-line-hair bg-card">
      <div style={{ minWidth }}>
        {/* ── Day headers ── */}
        <div
          className="grid border-b border-line-soft"
          style={{ gridTemplateColumns }}
        >
          <div aria-hidden />
          {days.map((day, i) => {
            const key = dayKeys[i];
            const isToday = key === todayKey;
            return (
              <div
                key={key}
                className={cn(
                  "flex items-center gap-1.5 border-l border-line-soft px-3 py-2.5 font-mono text-[11px]",
                  isToday ? "text-ink-900" : "text-ink-500"
                )}
              >
                <span>{DAY_LETTERS[day.getDay()]}</span>
                <span
                  className={cn(
                    "flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1",
                    isToday && "bg-evergreen-900 text-[#E9EDE0]"
                  )}
                >
                  {day.getDate()}
                </span>
                {days.length === 1 && (
                  <span className="ml-1 text-ink-400">
                    {new Intl.DateTimeFormat("en-US", { month: "long" }).format(day)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* ── All-day lane ── */}
        {hasAllDayLane && (
          <div
            className="grid border-b border-line-soft"
            style={{ gridTemplateColumns }}
          >
            <div className="flex items-start justify-end px-2 py-2">
              <span className="font-mono text-[9.5px] uppercase tracking-wide text-ink-400">
                all-day
              </span>
            </div>
            {dayKeys.map((key) => (
              <div
                key={key}
                className="flex min-h-[34px] cursor-pointer flex-col gap-1 border-l border-line-soft p-1.5"
                onClick={(e) => {
                  if (e.target === e.currentTarget) onCreateAt(key);
                }}
                title="Click to add an all-day event"
              >
                {(allDayByDay.get(key) ?? []).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onEdit(event)}
                    className={cn(
                      "truncate rounded-[7px] px-2 py-1 text-left text-[11px] font-semibold leading-tight text-ink-900 transition-colors",
                      event.type === "hold"
                        ? "border border-dashed border-sage-dash bg-sage-surface/50 hover:bg-sage-surface"
                        : "border border-line-soft border-l-[2.5px] border-l-emerald-500 bg-paper hover:bg-sunken"
                    )}
                    title={event.title}
                  >
                    {event.title}
                  </button>
                ))}
                {(tasksByDay.get(key) ?? []).map((task) => (
                  <span
                    key={task.id}
                    className={cn(
                      "flex items-center gap-1.5 truncate rounded-[7px] border border-line-soft border-l-[2.5px] border-l-ochre-500 bg-paper px-2 py-1 text-[11px] leading-tight text-ink-700",
                      task.completed && "opacity-50"
                    )}
                    title={`Task: ${task.title}`}
                  >
                    <CheckSquare size={10} className="shrink-0 text-ink-400" />
                    <span className={cn("truncate", task.completed && "line-through")}>
                      {task.title}
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── Hours ── */}
        <div
          ref={scrollRef}
          className="custom-scrollbar relative h-[528px] overflow-y-auto overscroll-contain"
        >
          <div
            className="relative grid"
            style={{ gridTemplateColumns, height: 24 * HOUR_PX }}
          >
            {/* Hour gutter */}
            <div className="relative" aria-hidden>
              {Array.from({ length: 23 }, (_, i) => (
                <span
                  key={i}
                  className="absolute right-2 -translate-y-1/2 font-mono text-[10px] text-ink-400"
                  style={{ top: (i + 1) * HOUR_PX }}
                >
                  {formatMinutes((i + 1) * 60)}
                </span>
              ))}
            </div>

            {days.map((day, i) => (
              <DayColumn
                key={dayKeys[i]}
                dayKey={dayKeys[i]}
                dayIndex={i}
                dayKeys={dayKeys}
                isToday={dayKeys[i] === todayKey}
                nowMin={nowMin}
                events={timedByDay.get(dayKeys[i]) ?? []}
                onCreateAt={onCreateAt}
                onEdit={onEdit}
                onReschedule={onReschedule}
              />
            ))}

            {/* Gentle empty-week hint floating over the morning hours */}
            {showEmptyHint && (
              <div
                className="pointer-events-none absolute inset-x-0 z-20 flex justify-center"
                style={{ top: 8.75 * HOUR_PX }}
              >
                <div className="rounded-full border border-line-hair bg-card/95 px-5 py-2.5 text-center shadow-float-1">
                  <span className="font-serif text-[15px] italic text-ink-700">
                    Nothing scheduled.
                  </span>
                  <span className="ml-2 text-[12px] text-ink-500">
                    Click any time slot to add something.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Day column ───────────────────────────────────────────────────────────────

function DayColumn({
  dayKey,
  dayIndex,
  dayKeys,
  isToday,
  nowMin,
  events,
  onCreateAt,
  onEdit,
  onReschedule,
}: {
  dayKey: string;
  dayIndex: number;
  dayKeys: string[];
  isToday: boolean;
  nowMin: number;
  events: CalendarEvent[];
  onCreateAt: (date: string, start?: string) => void;
  onEdit: (event: CalendarEvent) => void;
  onReschedule: (
    id: string,
    updates: { date?: string; start?: string; durationMin?: number }
  ) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const layout = useMemo(() => layoutDayEvents(events), [events]);

  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only truly empty space creates (cards handle their own clicks).
    if (e.target !== e.currentTarget || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const minutes = ((e.clientY - rect.top) / HOUR_PX) * 60;
    const snapped = Math.max(0, Math.min(DAY_MIN - 60, Math.floor(minutes / 30) * 30));
    onCreateAt(dayKey, toHHMM(snapped));
  };

  return (
    <div
      ref={ref}
      onClick={handleBackgroundClick}
      className={cn(
        "relative cursor-pointer border-l border-line-soft",
        isToday && "bg-sage-surface/20"
      )}
      title="Click to add an event"
    >
      {/* Hour rules */}
      {Array.from({ length: 23 }, (_, i) => (
        <div
          key={i}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 border-t border-line-soft/80"
          style={{ top: (i + 1) * HOUR_PX }}
        />
      ))}

      {/* Now line */}
      {isToday && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 z-20"
          style={{ top: (nowMin / 60) * HOUR_PX }}
        >
          <div className="relative h-[1.5px] bg-clay-500">
            <span className="absolute -left-[2px] -top-[2.5px] h-[6.5px] w-[6.5px] rounded-full bg-clay-500" />
          </div>
        </div>
      )}

      {layout.map((positioned) => (
        <TimedEventCard
          key={positioned.event.id}
          positioned={positioned}
          dayIndex={dayIndex}
          dayKeys={dayKeys}
          columnEl={ref}
          onEdit={onEdit}
          onReschedule={onReschedule}
        />
      ))}
    </div>
  );
}

// ─── Timed event card (click = edit · drag = move · bottom edge = resize) ────

function TimedEventCard({
  positioned,
  dayIndex,
  dayKeys,
  columnEl,
  onEdit,
  onReschedule,
}: {
  positioned: { event: CalendarEvent; startMin: number; endMin: number; col: number; cols: number };
  dayIndex: number;
  dayKeys: string[];
  columnEl: React.RefObject<HTMLDivElement | null>;
  onEdit: (event: CalendarEvent) => void;
  onReschedule: (
    id: string,
    updates: { date?: string; start?: string; durationMin?: number }
  ) => void;
}) {
  const { event, startMin, endMin, col, cols } = positioned;
  const durationMin = Math.max(SNAP_MIN, endMin - startMin);

  const [drag, setDrag] = useState<DragState | null>(null);
  const gesture = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    colWidth: number;
    mode: "move" | "resize";
    moved: boolean;
  } | null>(null);

  const beginGesture = (e: React.PointerEvent, mode: "move" | "resize") => {
    // Drag is a mouse affordance; touch keeps scrolling, taps still edit.
    if (e.button !== 0 || e.pointerType !== "mouse") return;
    e.stopPropagation();
    e.preventDefault();
    const colWidth = columnEl.current?.getBoundingClientRect().width ?? 100;
    gesture.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      colWidth,
      mode,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || e.pointerId !== g.pointerId) return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (!g.moved && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
    g.moved = true;

    const minuteDelta = Math.round((dy / HOUR_PX) * 60 / SNAP_MIN) * SNAP_MIN;
    if (g.mode === "resize") {
      const nextDur = Math.max(
        SNAP_MIN,
        Math.min(DAY_MIN - startMin, durationMin + minuteDelta)
      );
      setDrag({
        id: event.id,
        startMin,
        durationMin: nextDur,
        dayDelta: 0,
        colWidth: g.colWidth,
        mode: "resize",
      });
    } else {
      const nextStart = Math.max(
        0,
        Math.min(DAY_MIN - durationMin, startMin + minuteDelta)
      );
      const rawDayDelta = Math.round(dx / g.colWidth);
      const dayDelta = Math.max(-dayIndex, Math.min(dayKeys.length - 1 - dayIndex, rawDayDelta));
      setDrag({
        id: event.id,
        startMin: nextStart,
        durationMin,
        dayDelta,
        colWidth: g.colWidth,
        mode: "move",
      });
    }
  };

  const suppressClick = useRef(false);

  const onPointerUp = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || e.pointerId !== g.pointerId) return;
    gesture.current = null;
    // The browser still fires a click after this pointerup — we've already
    // decided what the mouse meant, so swallow it.
    suppressClick.current = true;

    if (!g.moved) {
      setDrag(null);
      onEdit(event);
      return;
    }
    if (drag) {
      if (drag.mode === "resize") {
        onReschedule(event.id, { durationMin: drag.durationMin });
      } else {
        onReschedule(event.id, {
          start: toHHMM(drag.startMin),
          ...(drag.dayDelta !== 0 ? { date: dayKeys[dayIndex + drag.dayDelta] } : {}),
        });
      }
    }
    setDrag(null);
  };

  const shownStart = drag?.startMin ?? startMin;
  const shownDur = drag?.durationMin ?? durationMin;
  const top = (shownStart / 60) * HOUR_PX;
  const height = Math.max(22, (shownDur / 60) * HOUR_PX - 2);
  const widthPct = 100 / cols;
  const isHold = event.type === "hold";

  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={(e) => beginGesture(e, "move")}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        gesture.current = null;
        setDrag(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        // Touch/keyboard path — mouse already handled itself in pointerup.
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        onEdit(event);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit(event);
        }
      }}
      className={cn(
        "group absolute z-10 select-none overflow-hidden rounded-[8px] text-left transition-shadow",
        isHold
          ? "border border-dashed border-sage-dash bg-[#EDF0E4]"
          : "border border-line-soft border-l-[2.5px] border-l-emerald-500 bg-paper",
        drag ? "z-30 cursor-grabbing shadow-float-2" : "cursor-grab hover:shadow-float-1"
      )}
      style={{
        top,
        height,
        left: `calc(${col * widthPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        transform:
          drag && drag.dayDelta !== 0
            ? `translateX(${drag.dayDelta * drag.colWidth}px)`
            : undefined,
      }}
      aria-label={`${event.title}, ${formatMinutes(shownStart)}`}
      title={`${event.title} — ${formatMinutes(shownStart)}–${formatMinutes(shownStart + shownDur)}`}
    >
      <div className="px-2 pt-1">
        <p className="truncate text-[11.5px] font-semibold leading-tight text-ink-900">
          {event.title}
        </p>
        {height >= 34 && (
          <p className="mt-px truncate font-mono text-[10px] text-ink-500">
            {formatMinutes(shownStart)}–{formatMinutes(shownStart + shownDur)}
            {event.note ? ` · ${event.note}` : ""}
          </p>
        )}
      </div>
      {/* Resize handle */}
      <div
        data-resize
        onPointerDown={(e) => beginGesture(e, "resize")}
        className="absolute inset-x-0 bottom-0 h-[7px] cursor-ns-resize"
        aria-hidden
      />
    </div>
  );
}

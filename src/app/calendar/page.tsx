"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import WeekGrid from "@/features/calendar/WeekGrid";
import EventModal, { type EventModalState } from "@/features/calendar/EventModal";
import { addDays, mondayOf, toHHMM } from "@/features/calendar/calendar-time";
import { useCalendarEvents, useCalendarActions } from "@/stores/use-calendar-store";
import { useTaskStore, useTaskActions } from "@/stores/use-task-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { getLocalDateKey } from "@/lib/format-date";
import { cn } from "@/lib/cn";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

/**
 * Calendar (design pass 2): a real time grid. Week or single day, hour gutter,
 * click-a-slot to create at that time, drag blocks to reschedule, a clay now-
 * line — while keeping the quiet column of unscheduled tasks.
 */

type ViewMode = "week" | "day";

export default function CalendarPage() {
  const hydrated = useHydrated();
  const events = useCalendarEvents();
  const { updateEvent } = useCalendarActions();
  const tasks = useTaskStore((state) => state.tasks);
  const { updateTask } = useTaskActions();

  const [mode, setMode] = useState<ViewMode>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [modal, setModal] = useState<EventModalState | null>(null);

  const days = useMemo(() => {
    if (mode === "day") {
      return [new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate())];
    }
    const monday = mondayOf(anchor);
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [anchor, mode]);

  const step = (direction: -1 | 1) =>
    setAnchor((a) => addDays(a, direction * (mode === "week" ? 7 : 1)));

  const unscheduled = tasks.filter((t) => !t.completed && !t.dueDate);

  const dayKeys = useMemo(() => days.map((d) => getLocalDateKey(d)), [days]);
  const rangeIsEmpty = useMemo(() => {
    const keys = new Set(dayKeys);
    return (
      !events.some((e) => keys.has(e.date)) &&
      !tasks.some((t) => t.dueDate && keys.has(getLocalDateKey(new Date(t.dueDate))))
    );
  }, [events, tasks, dayKeys]);

  const contextLabel = useMemo(() => {
    if (!hydrated) return "Calendar";
    if (mode === "day") {
      return `Calendar — ${new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(days[0])}`;
    }
    return `Calendar — week of ${new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
    }).format(days[0])}`;
  }, [hydrated, mode, days]);

  const openNewEvent = () => {
    // Next round hour today (or the viewed day), so the dialog starts sane.
    const now = new Date();
    const viewingToday = dayKeys.includes(getLocalDateKey(now));
    setModal({
      mode: "create",
      date: viewingToday ? getLocalDateKey(now) : dayKeys[0],
      start: toHHMM(Math.min(23 * 60, (now.getHours() + 1) * 60)),
    });
  };

  return (
    <div className="mx-auto max-w-[1360px] px-5 pb-12 pt-6 md:px-9 md:pt-8">
      <PageHeader
        size="h1"
        context={contextLabel}
        title={
          <>
            The week, <em>held loosely.</em>
          </>
        }
        actions={
          <>
            {/* Week / Day */}
            <div className="flex h-9 items-center gap-0.5 rounded-full bg-track p-1">
              {(["week", "day"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={cn(
                    "h-7 rounded-full px-3.5 text-[12.5px] capitalize transition-colors",
                    mode === m
                      ? "bg-card font-semibold text-ink-900 shadow-float-1"
                      : "text-ink-600 hover:text-ink-900"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-full border border-line-hair bg-card p-1">
              <button
                type="button"
                onClick={() => step(-1)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-sunken hover:text-ink-900"
                aria-label={mode === "week" ? "Previous week" : "Previous day"}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-sunken hover:text-ink-900"
                aria-label={mode === "week" ? "Next week" : "Next day"}
              >
                <ChevronRight size={15} />
              </button>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setAnchor(new Date())}>
              Today
            </Button>
            <Button size="sm" onClick={openNewEvent}>
              <Plus size={14} />
              New event
            </Button>
          </>
        }
      />

      <div className="mt-8 flex gap-6">
        <div className="min-w-0 flex-1">
          {!hydrated ? (
            <div className="skeleton-shimmer h-[560px] rounded-card" />
          ) : (
            <WeekGrid
              days={days}
              events={events}
              tasks={tasks}
              showEmptyHint={rangeIsEmpty}
              onCreateAt={(date, start) => setModal({ mode: "create", date, start })}
              onEdit={(event) => setModal({ mode: "edit", event })}
              onReschedule={(id, updates) => updateEvent(id, updates)}
            />
          )}
          <p className="mt-3 hidden text-[11.5px] text-ink-400 md:block">
            Click a slot to add · drag a block to move it · drag its bottom edge
            to change how long it runs
          </p>
        </div>

        {/* Unscheduled tasks */}
        <aside className="hidden w-[240px] shrink-0 xl:block" aria-label="Unscheduled tasks">
          <p className="px-1 text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
            Unscheduled
          </p>
          {hydrated && unscheduled.length === 0 ? (
            <p className="mt-3 px-1 text-[12.5px] leading-relaxed text-ink-500">
              Everything open has a day. Nice.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-1.5">
              {hydrated &&
                unscheduled.slice(0, 8).map((task) => (
                  <li
                    key={task.id}
                    className="group flex items-center gap-2 rounded-inner border border-line-hair bg-card px-3 py-2.5"
                  >
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-700">
                      {task.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        updateTask(task.id, {
                          dueDate: new Date(
                            now.getFullYear(),
                            now.getMonth(),
                            now.getDate(),
                            12
                          ).toISOString(),
                        });
                      }}
                      className="shrink-0 rounded-full border border-line-hair px-2 py-0.5 text-[10.5px] text-green-800 opacity-0 transition-opacity hover:border-green-800 group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      → today
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </aside>
      </div>

      {modal && <EventModal state={modal} onClose={() => setModal(null)} />}
    </div>
  );
}

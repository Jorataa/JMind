"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  useCalendarEvents,
  useCalendarActions,
  type CalendarEvent,
} from "@/stores/use-calendar-store";
import { useTaskStore, useTaskActions } from "@/stores/use-task-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { getLocalDateKey } from "@/lib/format-date";
import { cn } from "@/lib/cn";
import { ChevronLeft, ChevronRight, Plus, Trash2, CheckSquare } from "lucide-react";

/**
 * Calendar (design handoff §7): week view, mono day headers, stacked blocks
 * with a 2.5px left rule; dashed "hold" blocks; a quiet column of unscheduled
 * tasks that can be pulled into the week.
 */

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

function mondayOf(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export default function CalendarPage() {
  const hydrated = useHydrated();
  const events = useCalendarEvents();
  const { addEvent, removeEvent } = useCalendarActions();
  const tasks = useTaskStore((state) => state.tasks);
  const { updateTask } = useTaskActions();

  const [weekOffset, setWeekOffset] = useState(0);
  const [addingDay, setAddingDay] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const days = useMemo(() => {
    const monday = mondayOf(new Date());
    monday.setDate(monday.getDate() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const todayKey = getLocalDateKey();

  const unscheduled = tasks.filter((t) => !t.completed && !t.dueDate);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.start ?? "99") .localeCompare(b.start ?? "99"));
    }
    return map;
  }, [events]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const key = getLocalDateKey(new Date(task.dueDate));
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    return map;
  }, [tasks]);

  const commitDraft = (dayKey: string) => {
    const title = draft.trim();
    if (title) addEvent({ title, date: dayKey, type: "event" });
    setDraft("");
    setAddingDay(null);
  };

  const weekLabel = hydrated
    ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" }).format(days[0])
    : "";

  return (
    <div className="mx-auto max-w-[1360px] px-5 pb-12 pt-6 md:px-9 md:pt-8">
      <PageHeader
        size="h1"
        context={hydrated ? `Calendar — week of ${weekLabel}` : "Calendar"}
        title={
          <>
            The week, <em>held loosely.</em>
          </>
        }
        actions={
          <>
            <div className="flex items-center gap-1 rounded-full border border-line-hair bg-card p-1">
              <button
                type="button"
                onClick={() => setWeekOffset((w) => w - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-sunken hover:text-ink-900"
                aria-label="Previous week"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => setWeekOffset((w) => w + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-sunken hover:text-ink-900"
                aria-label="Next week"
              >
                <ChevronRight size={15} />
              </button>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setWeekOffset(0)}>
              Today
            </Button>
          </>
        }
      />

      <div className="mt-8 flex gap-6">
        {/* Week grid */}
        <div className="min-w-0 flex-1 overflow-x-auto">
          {!hydrated ? (
            <div className="skeleton-shimmer h-[380px] rounded-card" />
          ) : (
            <div className="grid min-w-[760px] grid-cols-7 overflow-hidden rounded-card border border-line-hair bg-card">
              {days.map((day, i) => {
                const dayKey = getLocalDateKey(day);
                const isToday = dayKey === todayKey;
                const dayEvents = eventsByDay.get(dayKey) ?? [];
                const dayTasks = tasksByDay.get(dayKey) ?? [];
                return (
                  <div
                    key={dayKey}
                    className={cn(
                      "group/day flex min-h-[380px] flex-col",
                      i > 0 && "border-l border-line-soft"
                    )}
                  >
                    {/* Day header */}
                    <div
                      className={cn(
                        "flex items-center gap-1.5 border-b border-line-soft px-3 py-2.5 font-mono text-[11px]",
                        isToday ? "text-ink-900" : "text-ink-500"
                      )}
                    >
                      <span>{DAY_LETTERS[i]}</span>
                      <span
                        className={cn(
                          "flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1",
                          isToday && "bg-evergreen-900 text-[#E9EDE0]"
                        )}
                      >
                        {day.getDate()}
                      </span>
                    </div>

                    {/* Blocks */}
                    <div className="flex flex-1 flex-col gap-1.5 p-2">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            "group/block relative rounded-[9px] py-1.5 pl-2.5 pr-6 text-left",
                            event.type === "hold"
                              ? "border border-dashed border-sage-dash bg-sage-surface/40"
                              : "border border-line-soft border-l-[2.5px] border-l-emerald-500 bg-paper"
                          )}
                        >
                          <p className="text-[12px] font-semibold leading-snug text-ink-900">
                            {event.title}
                          </p>
                          {(event.start || event.note) && (
                            <p className="mt-0.5 text-[10.5px] text-ink-500">
                              {[event.start, event.note].filter(Boolean).join(" · ")}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => removeEvent(event.id)}
                            className="absolute right-1 top-1 rounded p-0.5 text-ink-400 opacity-0 transition-opacity hover:text-clay-500 group-hover/block:opacity-100"
                            aria-label={`Remove ${event.title}`}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}

                      {dayTasks.map((task) => (
                        <div
                          key={task.id}
                          className={cn(
                            "flex items-start gap-1.5 rounded-[9px] border border-line-soft border-l-[2.5px] border-l-ochre-500 bg-paper py-1.5 pl-2.5 pr-2",
                            task.completed && "opacity-50"
                          )}
                        >
                          <CheckSquare size={11} className="mt-0.5 shrink-0 text-ink-400" />
                          <p
                            className={cn(
                              "text-[11.5px] leading-snug text-ink-700",
                              task.completed && "line-through"
                            )}
                          >
                            {task.title}
                          </p>
                        </div>
                      ))}

                      {/* Quick add */}
                      {addingDay === dayKey ? (
                        <input
                          autoFocus
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onBlur={() => commitDraft(dayKey)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitDraft(dayKey);
                            if (e.key === "Escape") {
                              setDraft("");
                              setAddingDay(null);
                            }
                          }}
                          placeholder="Event title…"
                          className="rounded-[9px] border border-line-strong bg-card px-2.5 py-1.5 text-[12px] text-ink-700 placeholder:text-ink-400 focus:border-emerald-500 focus:outline-none"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAddingDay(dayKey)}
                          className="mt-auto flex items-center gap-1 self-start rounded-[9px] px-2 py-1 text-[11px] text-ink-400 opacity-0 transition-opacity hover:bg-sunken hover:text-ink-600 focus-visible:opacity-100 group-hover/day:opacity-100"
                        >
                          <Plus size={11} />
                          add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                      className="shrink-0 rounded-full border border-line-hair px-2 py-0.5 text-[10.5px] text-green-800 opacity-0 transition-opacity hover:border-green-800 group-hover:opacity-100"
                    >
                      → today
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

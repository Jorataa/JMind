"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GripVertical, Plus, Search, Trash2, Check } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import NewTaskModal from "./NewTaskModal";
import { useTaskStore, useTaskActions } from "@/stores/use-task-store";
import { useMindMapActions } from "@/stores/use-mindmap-store";
import { useGroves, GROVE_DOT_CLASS } from "@/stores/use-grove-store";
import { useCalendarEvents } from "@/stores/use-calendar-store";
import { useInbox } from "@/stores/use-inbox-store";
import { useToast } from "@/stores/use-toast-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { getLocalDateKey } from "@/lib/format-date";
import type { Task, TaskPriority, TaskEnergy } from "@/types/tasks";
import { cn } from "@/lib/cn";

/**
 * Tasks (design handoff #2c, §6.7): energy-grouped rows with provenance chips,
 * a Noticed card, the This-Week pulse, and the scheduled week-ahead strip.
 */

type Scope = "today" | "week" | "all";

const WORDS = ["A clear day", "One thing", "Two things", "Three things", "Four things", "Five things"];

function headlineFor(openTodayCount: number) {
  if (openTodayCount === 0)
    return (
      <>
        A clear day — <em>use it on purpose.</em>
      </>
    );
  if (openTodayCount >= 6)
    return (
      <>
        A full plate — <em>start with one.</em>
      </>
    );
  return (
    <>
      {WORDS[openTodayCount]}, <em>then the day is yours.</em>
    </>
  );
}

function endOfWeekKey(): string {
  const now = new Date();
  const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  sunday.setDate(sunday.getDate() + (7 - ((sunday.getDay() + 6) % 7)) - 1);
  return getLocalDateKey(sunday);
}

export default function TasksPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const tasks = useTaskStore((state) => state.tasks);
  const { toggleTask, removeTask, reorderTask, updateTask } = useTaskActions();
  const { switchMap, requestNodeFocus } = useMindMapActions();
  const groves = useGroves();
  const events = useCalendarEvents();
  const inboxCount = useInbox().length;
  const addToast = useToast();

  const [scope, setScope] = useState<Scope>("today");
  const [groveFilter, setGroveFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | TaskPriority>("all");
  const [energyFilter, setEnergyFilter] = useState<"all" | TaskEnergy>("all");
  const [search, setSearch] = useState("");
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const todayKey = getLocalDateKey();
  const weekEnd = endOfWeekKey();

  // Legacy category labels double as quiet filter chips alongside groves.
  const categories = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.category && !t.groveId) set.add(t.category);
    });
    return [...set].slice(0, 4);
  }, [tasks]);

  const inScope = useMemo(() => {
    const dueKey = (t: Task) => (t.dueDate ? getLocalDateKey(new Date(t.dueDate)) : null);
    const doneKey = (t: Task) =>
      t.completedAt ? getLocalDateKey(new Date(t.completedAt)) : null;

    return tasks.filter((t) => {
      if (scope === "today") {
        const due = dueKey(t);
        if (t.completed) return doneKey(t) === todayKey;
        return !due || due <= todayKey;
      }
      if (scope === "week") {
        const due = dueKey(t);
        if (t.completed) {
          const done = doneKey(t);
          return done !== null && done <= weekEnd && done >= getLocalDateKey(mondayOf());
        }
        return !due || due <= weekEnd;
      }
      return true;
    });
  }, [tasks, scope, todayKey, weekEnd]);

  const visible = useMemo(
    () =>
      inScope.filter((t) => {
        if (groveFilter !== "all") {
          if (groveFilter.startsWith("cat:")) {
            if (t.category !== groveFilter.slice(4)) return false;
          } else if (t.groveId !== groveFilter) return false;
        }
        if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
        if (energyFilter !== "all" && t.energy !== energyFilter) return false;
        if (search && !`${t.title} ${t.category ?? ""}`.toLowerCase().includes(search.toLowerCase()))
          return false;
        return true;
      }),
    [inScope, groveFilter, priorityFilter, energyFilter, search]
  );

  const deep = visible.filter((t) => t.energy === "deep");
  const light = visible.filter((t) => t.energy !== "deep");

  const openTodayCount = useMemo(
    () =>
      tasks.filter((t) => {
        if (t.completed) return false;
        const due = t.dueDate ? getLocalDateKey(new Date(t.dueDate)) : null;
        return !due || due <= todayKey;
      }).length,
    [tasks, todayKey]
  );

  const handleToggle = (task: Task) => {
    toggleTask(task.id);
    if (!task.completed) {
      addToast("Done", "success", { label: "undo", onAction: () => toggleTask(task.id) });
    }
  };

  const jumpToSource = (task: Task) => {
    if (!task.sourceNodeId) return;
    if (task.sourceMapId) switchMap(task.sourceMapId);
    requestNodeFocus(task.sourceNodeId);
    router.push("/mindmap");
  };

  const handleDrop = (beforeId: string | null) => {
    if (dragId) reorderTask(dragId, beforeId);
    setDragId(null);
    setDropTarget(null);
  };

  // Overdue insight for the Noticed card — with real actions.
  const overdue = useMemo(
    () =>
      tasks.filter(
        (t) => !t.completed && t.dueDate && getLocalDateKey(new Date(t.dueDate)) < todayKey
      ),
    [tasks, todayKey]
  );

  const weekLabel = hydrated
    ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" }).format(mondayOf())
    : "";

  const rowProps = (task: Task) => ({
    task,
    groves,
    dragging: dragId === task.id,
    dropBefore: dropTarget === task.id,
    onToggle: () => handleToggle(task),
    onRemove: () => {
      removeTask(task.id);
      addToast("Task removed", "info");
    },
    onJump: task.sourceNodeId ? () => jumpToSource(task) : undefined,
    onDragStart: () => setDragId(task.id),
    onDragOverRow: () => dragId && dragId !== task.id && setDropTarget(task.id),
    onDropRow: () => handleDrop(task.id),
    todayKey,
  });

  return (
    <div className="mx-auto max-w-[1360px] px-5 pb-12 pt-6 md:px-9 md:pt-8">
      <PageHeader
        size="h1"
        context={hydrated ? `Tasks — week of ${weekLabel}` : "Tasks"}
        title={hydrated ? headlineFor(openTodayCount) : <>&nbsp;</>}
        actions={
          <>
            <div className="flex h-9 items-center gap-0.5 rounded-full bg-track p-1">
              {(["today", "week", "all"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  aria-pressed={scope === s}
                  className={cn(
                    "h-7 rounded-full px-3.5 text-[12.5px] capitalize transition-colors",
                    scope === s
                      ? "bg-card font-semibold text-ink-900 shadow-float-1"
                      : "text-ink-600 hover:text-ink-900"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <Button onClick={() => setNewTaskOpen(true)}>New task</Button>
          </>
        }
      />

      {/* Filter row (§7) */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <FilterChip label="All" active={groveFilter === "all"} onClick={() => setGroveFilter("all")} />
        {hydrated &&
          groves.map((grove) => (
            <FilterChip
              key={grove.id}
              label={grove.name}
              dotClass={GROVE_DOT_CLASS[grove.color]}
              active={groveFilter === grove.id}
              onClick={() => setGroveFilter(groveFilter === grove.id ? "all" : grove.id)}
            />
          ))}
        {hydrated &&
          categories.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              active={groveFilter === `cat:${cat}`}
              onClick={() => setGroveFilter(groveFilter === `cat:${cat}` ? "all" : `cat:${cat}`)}
            />
          ))}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as "all" | TaskPriority)}
          className="h-8 rounded-full border border-line-hair bg-card px-3 text-[12px] text-ink-600 focus:outline-none"
          aria-label="Filter by priority"
        >
          <option value="all">Any priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={energyFilter}
          onChange={(e) => setEnergyFilter(e.target.value as "all" | TaskEnergy)}
          className="h-8 rounded-full border border-line-hair bg-card px-3 text-[12px] text-ink-600 focus:outline-none"
          aria-label="Filter by energy"
        >
          <option value="all">Any energy</option>
          <option value="deep">Deep</option>
          <option value="quick">Quick</option>
          <option value="low">Low</option>
        </select>
        <div className="ml-auto flex h-8 min-w-[180px] items-center gap-2 rounded-full border border-line-hair bg-card pl-3 pr-2 focus-within:border-emerald-500">
          <Search size={13} className="shrink-0 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-full bg-transparent text-[12.5px] text-ink-700 placeholder:text-ink-400 focus:outline-none"
            aria-label="Search tasks"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-[13px] xl:grid-cols-[1fr_340px]">
        {/* Task groups */}
        <div className="flex min-w-0 flex-col gap-[13px]">
          {!hydrated ? (
            <>
              <div className="skeleton-shimmer h-40 rounded-card" />
              <div className="skeleton-shimmer h-40 rounded-card" />
            </>
          ) : deep.length + light.length === 0 ? (
            <Card>
              <EmptyState
                className="py-10"
                title="Nothing held for today."
                description="Capture a task below, promote one from the Inbox, or send a node over from the Workspace."
                action={
                  <Button onClick={() => setNewTaskOpen(true)}>
                    <Plus size={15} />
                    New task
                  </Button>
                }
                footer={
                  inboxCount > 0 ? (
                    <Link href="/inbox" className="text-[12.5px] text-green-800 hover:underline">
                      {inboxCount} capture{inboxCount === 1 ? "" : "s"} waiting in the Inbox →
                    </Link>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            <>
              {deep.length > 0 && (
                <TaskGroup
                  label="Morning — deep"
                  tasks={deep}
                  rowProps={rowProps}
                  onDropAtEnd={() => handleDrop(null)}
                />
              )}
              {light.length > 0 && (
                <TaskGroup
                  label={deep.length > 0 ? "Anytime — light" : "Today"}
                  tasks={light}
                  rowProps={rowProps}
                  onDropAtEnd={() => handleDrop(null)}
                />
              )}
            </>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-[13px]">
          {hydrated && overdue.length > 0 && (
            <NoticedCard
              overdue={overdue}
              onReschedule={() => {
                const noon = new Date();
                overdue.forEach((t) =>
                  updateTask(t.id, {
                    dueDate: new Date(
                      noon.getFullYear(),
                      noon.getMonth(),
                      noon.getDate(),
                      12
                    ).toISOString(),
                  })
                );
                addToast(`Rescheduled ${overdue.length} to today`, "success");
              }}
              onRelease={() => {
                overdue.forEach((t) => updateTask(t.id, { dueDate: undefined }));
                addToast("Dates released — they'll wait quietly", "info");
              }}
            />
          )}
          {hydrated && <ThisWeekCard tasks={tasks} todayKey={todayKey} />}
        </div>
      </div>

      {/* Scheduled — week ahead */}
      {hydrated && <ScheduledStrip tasks={tasks} events={events} todayKey={todayKey} />}

      {newTaskOpen && <NewTaskModal onClose={() => setNewTaskOpen(false)} />}
    </div>
  );
}

function mondayOf(): Date {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function FilterChip({
  label,
  active,
  onClick,
  dotClass,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  dotClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] transition-colors",
        active
          ? "bg-sage-surface font-medium text-green-800"
          : "border border-line-hair bg-card text-ink-600 hover:text-ink-900"
      )}
    >
      {dotClass && <span className={cn("h-[7px] w-[7px] rounded-[3px]", dotClass)} />}
      {label}
    </button>
  );
}

/* ── Group card with §6.7 rows ── */

function TaskGroup({
  label,
  tasks,
  rowProps,
  onDropAtEnd,
}: {
  label: string;
  tasks: Task[];
  rowProps: (task: Task) => TaskRowProps;
  onDropAtEnd: () => void;
}) {
  const open = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed).slice(0, 3);

  return (
    <Card className="gap-0 p-0">
      <p className="px-5 pb-1 pt-4 text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
        {label}
      </p>
      <ul
        className="px-2 pb-2"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onDropAtEnd();
        }}
      >
        {open.map((task) => (
          <TaskRow key={task.id} {...rowProps(task)} />
        ))}
        {done.map((task) => (
          <TaskRow key={task.id} {...rowProps(task)} />
        ))}
      </ul>
    </Card>
  );
}

interface TaskRowProps {
  task: Task;
  groves: ReturnType<typeof useGroves>;
  dragging: boolean;
  dropBefore: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onJump?: () => void;
  onDragStart: () => void;
  onDragOverRow: () => void;
  onDropRow: () => void;
  todayKey: string;
}

const PRIORITY_RULE: Record<TaskPriority, string> = {
  high: "bg-clay-500",
  medium: "bg-ochre-500",
  low: "bg-transparent",
};

function TaskRow({
  task,
  groves,
  dragging,
  dropBefore,
  onToggle,
  onRemove,
  onJump,
  onDragStart,
  onDragOverRow,
  onDropRow,
  todayKey,
}: TaskRowProps) {
  const grove = groves.find((g) => g.id === task.groveId);
  const dueKey = task.dueDate ? getLocalDateKey(new Date(task.dueDate)) : null;
  const dueChip = !task.completed && dueKey
    ? dueKey < todayKey
      ? { label: "overdue", cls: "bg-clay-bg text-clay-text" }
      : dueKey === todayKey
        ? { label: "today", cls: "bg-clay-bg text-clay-text" }
        : {
            label: `by ${new Date(task.dueDate!).toLocaleDateString("en-US", { weekday: "short" })}`,
            cls: "bg-sunken text-ink-600",
          }
    : null;

  return (
    <li
      draggable={!task.completed}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOverRow();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDropRow();
      }}
      className={cn(
        "group relative flex min-h-[46px] items-center gap-3 rounded-[10px] py-2.5 pl-6 pr-2 transition-colors hover:bg-[#FAF8F1]",
        dragging && "opacity-40",
        dropBefore && "shadow-[inset_0_2px_0_var(--color-emerald-500)]"
      )}
    >
      {/* 3px priority rule inside the padding zone (§6.7) */}
      {!task.completed && (
        <span
          aria-hidden
          className={cn(
            "absolute left-1.5 top-2.5 bottom-2.5 w-[3px] rounded-full",
            PRIORITY_RULE[task.priority]
          )}
        />
      )}

      {/* Grab handle on hover */}
      {!task.completed && (
        <GripVertical
          size={12}
          aria-hidden
          className="absolute -left-1 top-1/2 -translate-y-1/2 cursor-grab text-ink-400 opacity-0 transition-opacity group-hover:opacity-100"
        />
      )}

      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition-colors duration-150",
          task.completed
            ? "border-emerald-500 text-emerald-500"
            : "border-ink-400 text-transparent hover:border-green-800"
        )}
        aria-label={task.completed ? `Reopen "${task.title}"` : `Complete "${task.title}"`}
      >
        <Check size={11} strokeWidth={3} />
      </button>

      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[13.5px] font-medium transition-colors duration-200",
          task.completed ? "text-ink-400 line-through" : "text-ink-700"
        )}
      >
        {task.title}
      </span>

      {task.completed && task.completedAt ? (
        <span className="shrink-0 font-mono text-[10.5px] text-ink-400">
          done{" "}
          {new Date(task.completedAt).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      ) : (
        <span className="flex shrink-0 items-center gap-1.5">
          {dueChip && (
            <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-medium", dueChip.cls)}>
              {dueChip.label}
            </span>
          )}
          {onJump ? (
            <button
              type="button"
              onClick={onJump}
              className="rounded-full bg-sage-surface px-2 py-0.5 text-[10.5px] font-medium text-green-800 transition-colors hover:bg-sage-border/60"
              title="Open the node this came from"
            >
              from map
            </button>
          ) : (
            <span className="rounded-full bg-sunken px-2 py-0.5 text-[10.5px] text-ink-600">
              {task.energy}
            </span>
          )}
          {grove && (
            <span
              className={cn("h-[7px] w-[7px] rounded-[3px]", GROVE_DOT_CLASS[grove.color])}
              title={grove.name}
            />
          )}
        </span>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded p-1 text-ink-400 opacity-0 transition-opacity hover:text-clay-500 focus-visible:opacity-100 group-hover:opacity-100"
        aria-label={`Delete "${task.title}"`}
      >
        <Trash2 size={13} />
      </button>
    </li>
  );
}

/* ── Noticed (sage) ── */

function NoticedCard({
  overdue,
  onReschedule,
  onRelease,
}: {
  overdue: Task[];
  onReschedule: () => void;
  onRelease: () => void;
}) {
  const first = overdue[0];
  return (
    <Card variant="sage" className="gap-3">
      <div className="flex items-center gap-2">
        <span className="ai-pulse h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
        <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
          Noticed
        </p>
      </div>
      <p className="font-serif text-[15.5px] leading-[1.42] text-ink-900">
        {overdue.length === 1 ? (
          <>
            <em className="italic text-green-800">
              “{first.title.length > 38 ? `${first.title.slice(0, 37)}…` : first.title}”
            </em>{" "}
            slipped past its date — reschedule it or let it go.
          </>
        ) : (
          <>
            <em className="italic text-green-800">{overdue.length} tasks</em> slipped past
            their dates — reschedule them or let them go.
          </>
        )}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onReschedule}
          className="rounded-full bg-evergreen-900 px-3.5 py-1.5 text-[12px] font-medium text-[#E9EDE0] transition-colors hover:bg-evergreen-deep"
        >
          Reschedule to today
        </button>
        <button
          type="button"
          onClick={onRelease}
          className="rounded-full px-2.5 py-1.5 text-[12px] text-ink-600 transition-colors hover:text-ink-900"
        >
          Release
        </button>
      </div>
    </Card>
  );
}

/* ── This week pulse ── */

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

function ThisWeekCard({ tasks, todayKey }: { tasks: Task[]; todayKey: string }) {
  const days = useMemo(() => {
    const monday = mondayOf();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = getLocalDateKey(d);
      const count = tasks.filter(
        (t) => t.completed && t.completedAt && getLocalDateKey(new Date(t.completedAt)) === key
      ).length;
      return { key, count, name: d.toLocaleDateString("en-US", { weekday: "long" }) };
    });
  }, [tasks]);

  const max = Math.max(...days.map((d) => d.count), 1);
  const heaviest = days.reduce((a, b) => (b.count > a.count ? b : a), days[0]);

  return (
    <Card className="gap-4">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
        This week
      </p>
      <div className="flex h-[72px] items-end gap-2" aria-hidden>
        {days.map((day, i) => (
          <div key={day.key} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={cn(
                "w-full rounded-[5px] transition-all",
                day.key === todayKey
                  ? "bg-evergreen-900"
                  : day.count > 0
                    ? "bg-sage-500/70"
                    : "bg-sunken"
              )}
              style={{ height: 8 + (day.count / max) * 48 }}
            />
            <span className="font-mono text-[10px] text-ink-500">{DAY_LETTERS[i]}</span>
          </div>
        ))}
      </div>
      <p className="text-[12.5px] leading-relaxed text-ink-600">
        Done when it&apos;s done — no streaks, no guilt.
        {heaviest.count > 1 && ` ${heaviest.name} is your heaviest day.`}
      </p>
    </Card>
  );
}

/* ── Scheduled — week ahead ── */

function ScheduledStrip({
  tasks,
  events,
  todayKey,
}: {
  tasks: Task[];
  events: ReturnType<typeof useCalendarEvents>;
  todayKey: string;
}) {
  const days = useMemo(() => {
    const monday = mondayOf();
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = getLocalDateKey(d);
      return {
        key,
        label: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
        num: d.getDate(),
        events: events
          .filter((e) => e.date === key)
          .sort((a, b) => (a.start ?? "99").localeCompare(b.start ?? "99")),
        tasks: tasks.filter(
          (t) => !t.completed && t.dueDate && getLocalDateKey(new Date(t.dueDate)) === key
        ),
      };
    });
  }, [tasks, events]);

  return (
    <Card className="mt-[13px] gap-4">
      <div className="flex items-center gap-2">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
          Scheduled — week ahead
        </p>
        <span className="flex-1" />
        <Link href="/calendar" className="text-[12.5px] text-green-800 hover:underline">
          Open calendar
        </Link>
      </div>
      <div className="-mx-1 overflow-x-auto">
        <div className="grid min-w-[640px] grid-cols-5 gap-3 px-1">
          {days.map((day) => (
            <div key={day.key} className="min-w-0">
              <p
                className={cn(
                  "border-b pb-1.5 font-mono text-[10.5px]",
                  day.key === todayKey
                    ? "border-evergreen-900 text-ink-900"
                    : "border-line-soft text-ink-500"
                )}
              >
                {day.label} {day.num}
                {day.key === todayKey && (
                  <span className="ml-1.5 rounded-full bg-evergreen-900 px-1.5 py-px text-[9px] text-[#E9EDE0]">
                    today
                  </span>
                )}
              </p>
              <div className="mt-2 flex flex-col gap-1.5">
                {day.events.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "rounded-[9px] py-1.5 pl-2.5 pr-2",
                      event.type === "hold"
                        ? "border border-dashed border-sage-dash bg-sage-surface/40"
                        : "border border-line-soft border-l-[2.5px] border-l-emerald-500 bg-paper"
                    )}
                  >
                    <p className="truncate text-[11.5px] font-semibold text-ink-900">
                      {event.title}
                    </p>
                    {event.start && (
                      <p className="mt-0.5 text-[10px] text-ink-500">{event.start}</p>
                    )}
                  </div>
                ))}
                {day.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-[9px] border border-line-soft border-l-[2.5px] border-l-ochre-500 bg-paper py-1.5 pl-2.5 pr-2"
                  >
                    <p className="truncate text-[11.5px] text-ink-700">{task.title}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

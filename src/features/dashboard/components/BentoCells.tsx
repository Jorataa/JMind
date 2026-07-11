"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  PencilLine,
  Plus,
  Play,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { Constellation, ContourRings } from "@/components/ui/ContourArt";
import MindMapPreview from "./MindMapPreview";
import { composeBrief, deriveNoticings, type Noticing } from "@/lib/dashboard-insights";
import { getLocalDateKey, formatRelativeTime } from "@/lib/format-date";
import { useTaskStore, useTaskActions } from "@/stores/use-task-store";
import { useUIActions } from "@/stores/use-ui-store";
import { useMindMapStore } from "@/stores/use-mindmap-store";
import { useShallow } from "zustand/shallow";
import { useInbox, useInboxActions } from "@/stores/use-inbox-store";
import { useNotes, useNoteActions } from "@/stores/use-note-store";
import {
  useKnowledgeSources,
  type SourceType,
} from "@/stores/use-knowledge-store";
import { useCalendarEvents } from "@/stores/use-calendar-store";
import { useKPIStore } from "@/stores/use-kpi-store";
import { useFocusStore } from "@/stores/use-focus-store";
import { useToast } from "@/stores/use-toast-store";

/* ── Shared widget header (§6.4): caps label · count · ↗ chip ── */

function CellHeader({
  label,
  right,
  href,
  hrefLabel,
  dark,
}: {
  label: string;
  right?: React.ReactNode;
  href?: string;
  hrefLabel?: string;
  dark?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <p
        className={cn(
          "text-[10.5px] font-medium uppercase tracking-[0.18em]",
          dark ? "text-rail-faint" : "text-ink-500"
        )}
      >
        {label}
      </p>
      {right}
      <span className="flex-1" />
      {href && (
        <Link
          href={href}
          aria-label={hrefLabel ?? `Open ${label.toLowerCase()}`}
          className={cn(
            "flex h-[26px] w-[26px] items-center justify-center rounded-full border transition-colors",
            dark
              ? "border-[rgba(233,237,224,0.18)] text-emerald-300 hover:bg-[rgba(233,237,224,0.08)]"
              : "border-line-hair text-green-800 hover:bg-sunken"
          )}
        >
          <ArrowUpRight size={13} strokeWidth={2} />
        </Link>
      )}
    </div>
  );
}

/* ── Hero: Jorata's brief + capture (dark, 5×2) ── */

type CaptureChip = "note" | "map" | "task" | "ask";

export function HeroBriefCell({
  className,
  isFresh,
}: {
  className?: string;
  isFresh: boolean;
}) {
  const router = useRouter();
  const addToast = useToast();
  const tasks = useTaskStore((state) => state.tasks);
  const events = useCalendarEvents();
  const inboxCount = useInbox().length;
  const { capture } = useInboxActions();
  const { addTask } = useTaskActions();
  const { addNote } = useNoteActions();
  const { openAssistant } = useUIActions();
  const createMap = useMindMapStore((state) => state.actions.createMap);

  const [value, setValue] = useState("");
  const [chip, setChip] = useState<CaptureChip | null>(null);

  const todayKey = getLocalDateKey();
  const todayEvents = useMemo(
    () => events.filter((e) => e.date === todayKey),
    [events, todayKey]
  );
  const brief = useMemo(
    () => composeBrief(tasks, todayEvents, isFresh),
    [tasks, todayEvents, isFresh]
  );

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = value.trim();
    if (!text) return;
    if (chip === "note") {
      addNote({ body: text });
      addToast("Saved to Notes", "success");
    } else if (chip === "task") {
      addTask(text, "medium", "quick");
      addToast("Task added", "success");
    } else if (chip === "map") {
      createMap(text.length > 60 ? `${text.slice(0, 59)}…` : text);
      router.push("/mindmap");
      return;
    } else if (chip === "ask") {
      setValue("");
      setChip(null);
      openAssistant(text);
      return;
    } else {
      capture(text);
      addToast("Captured to Inbox", "success");
    }
    setValue("");
    setChip(null);
  };

  const chips: { id: CaptureChip; label: string }[] = [
    { id: "note", label: "Note" },
    { id: "map", label: "Map" },
    { id: "task", label: "Task" },
    { id: "ask", label: "Ask AI" },
  ];

  return (
    <Card variant="dark" className={cn("overflow-hidden p-6", className)}>
      <Constellation className="absolute -right-6 -top-4 opacity-90" size={250} />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center gap-2">
          <span className="ai-pulse h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
          <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-rail-faint">
            Jorata&apos;s brief
          </p>
        </div>

        <p className="mt-5 max-w-[85%] font-serif text-[21.5px] leading-[1.32] text-[#E9EDE0]">
          {brief.pre}
          {brief.em && <em className="italic text-emerald-300">{brief.em}</em>}
          {brief.post}
        </p>

        <div className="flex-1" />

        {/* Capture (§5.5 grammar, dark-well variant) */}
        <form onSubmit={submit}>
          <div className="flex items-center gap-2.5 rounded-[12px] border border-[rgba(233,237,224,0.13)] bg-[rgba(233,237,224,0.09)] px-3.5 py-2.5 transition-colors focus-within:border-emerald-500">
            <PencilLine size={14} className="shrink-0 text-rail-faint" />
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="What's on your mind?"
              autoFocus={isFresh}
              className="w-full bg-transparent text-[14px] text-rail-bright placeholder:text-rail-faint focus:outline-none"
              aria-label="Capture a thought"
            />
            {value && (
              <button
                type="button"
                onClick={() => setValue("")}
                className="text-rail-faint hover:text-rail-text"
                aria-label="Clear"
              >
                ×
              </button>
            )}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            {chips.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setChip(chip === c.id ? null : c.id)}
                aria-pressed={chip === c.id}
                className={cn(
                  "rounded-full px-3 py-1 text-[11.5px] font-medium transition-colors",
                  chip === c.id
                    ? "bg-sage-surface text-evergreen-950"
                    : "border border-[rgba(233,237,224,0.14)] text-rail-muted hover:text-rail-text"
                )}
              >
                {c.label}
              </button>
            ))}
            {inboxCount > 0 && (
              <Link
                href="/inbox"
                className="ml-auto rounded-full border border-[rgba(233,237,224,0.14)] px-3 py-1 text-[11.5px] text-rail-muted transition-colors hover:text-rail-text"
              >
                Inbox · {inboxCount}
              </Link>
            )}
          </div>
        </form>
      </div>
    </Card>
  );
}

/* ── Workspace preview (4×2) ── */

export function WorkspaceCell({ className }: { className?: string }) {
  const { title, nodeCount, updatedAt } = useMindMapStore(
    useShallow((state) => {
      const map = state.maps[state.activeMapId];
      return {
        title: map?.title ?? "Untitled map",
        nodeCount: state.nodes.length,
        updatedAt: map?.updatedAt,
      };
    })
  );

  return (
    <Card className={cn("gap-3.5", className)}>
      <CellHeader label="Workspace" href="/mindmap" hrefLabel="Open the Workspace" />
      <MindMapPreview className="min-h-[140px] flex-1" />
      <div className="flex items-baseline gap-2">
        <p className="min-w-0 flex-1 truncate">
          <span className="text-[13.5px] font-semibold text-ink-900">{title}</span>
          <span className="ml-2 text-[12px] text-ink-500">
            {nodeCount} {nodeCount === 1 ? "node" : "nodes"}
            {updatedAt ? ` · ${formatRelativeTime(updatedAt)}` : ""}
          </span>
        </p>
        <Link
          href="/mindmap"
          className="shrink-0 text-[13px] font-medium text-green-800 hover:underline"
        >
          Continue →
        </Link>
      </div>
    </Card>
  );
}

/* ── Assistant noticings (sage, 3×2) ── */

export function AssistantCell({ className }: { className?: string }) {
  const tasks = useTaskStore((state) => state.tasks);
  const inboxCount = useInbox().length;
  const kpis = useKPIStore((state) => state.kpis);
  const activeMap = useMindMapStore(
    useShallow((state) => {
      const map = state.maps[state.activeMapId];
      return map ? { title: map.title, updatedAt: map.updatedAt } : undefined;
    })
  );
  const focus = useFocusStore(
    useShallow((state) => ({
      activeTaskId: state.activeTaskId,
      deepWorkMode: state.deepWorkMode,
    }))
  );
  const setDeepWorkMode = useFocusStore((state) => state.actions.setDeepWorkMode);

  const [dismissed, setDismissed] = useState<string[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem("jorata:noticed-later") ?? "[]");
    } catch {
      return [];
    }
  });

  const noticings = useMemo(
    () =>
      deriveNoticings({ tasks, inboxCount, activeMap, kpis, focus }).filter(
        (n) => !dismissed.includes(n.id)
      ),
    [tasks, inboxCount, activeMap, kpis, focus, dismissed]
  );

  const later = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try {
      sessionStorage.setItem("jorata:noticed-later", JSON.stringify(next));
    } catch {
      /* private mode */
    }
  };

  return (
    <Card variant="sage" className={cn("overflow-hidden", className)}>
      <ContourRings
        variant="sage"
        size={190}
        className="absolute -bottom-12 -right-10 opacity-60"
      />
      <div className="relative z-10 flex h-full flex-col">
        <CellHeader
          label="Assistant"
          dark={false}
          right={
            noticings.length > 0 ? (
              <span className="text-[11px] font-medium text-emerald-600">
                {noticings.length} noticing{noticings.length > 1 ? "s" : ""}
              </span>
            ) : undefined
          }
        />

        <div aria-live="polite" className="mt-4 flex flex-1 flex-col gap-4">
          {noticings.length === 0 ? (
            <div className="flex flex-1 flex-col items-start justify-center">
              <p className="font-serif text-[18.5px] leading-[1.4] text-ink-900">
                All quiet — nothing needs your attention right now.
              </p>
              <p className="mt-2 text-[12.5px] text-ink-600">
                Jorata notices overdue work, quiet maps and piling captures.
              </p>
            </div>
          ) : (
            noticings.map((noticing, i) => (
              <NoticingRow
                key={noticing.id}
                noticing={noticing}
                divider={i > 0}
                onLater={() => later(noticing.id)}
                onResume={() => setDeepWorkMode(true)}
              />
            ))
          )}
        </div>

        {/* Composer → the Assistant dock (§7, mockup #3a). */}
        <AskAnything />
      </div>
    </Card>
  );
}

function AskAnything() {
  const { openAssistant } = useUIActions();
  const [question, setQuestion] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!question.trim()) return;
        openAssistant(question.trim());
        setQuestion("");
      }}
      className="mt-4"
    >
      <div className="flex items-center gap-2 rounded-full border border-sage-border bg-card py-1 pl-3.5 pr-1 transition-colors focus-within:border-emerald-500">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything…"
          className="w-full bg-transparent text-[12.5px] text-ink-900 placeholder:text-ink-400 focus:outline-none"
          aria-label="Ask the assistant anything"
        />
        <button
          type="submit"
          disabled={!question.trim()}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-evergreen-900 text-[#E9EDE0] transition-colors hover:bg-evergreen-deep disabled:opacity-40"
          aria-label="Send to assistant"
        >
          <ArrowUpRight size={12.5} />
        </button>
      </div>
    </form>
  );
}

function NoticingRow({
  noticing,
  divider,
  onLater,
  onResume,
}: {
  noticing: Noticing;
  divider: boolean;
  onLater: () => void;
  onResume: () => void;
}) {
  return (
    <div className={cn(divider && "border-t border-sage-border/60 pt-4")}>
      <p className="font-serif text-[15.5px] leading-[1.42] text-ink-900">
        {noticing.pre}
        {noticing.em && <em className="italic text-green-800">{noticing.em}</em>}
        {noticing.post}
      </p>
      <div className="mt-2.5 flex items-center gap-2">
        {"href" in noticing.action ? (
          <Link
            href={noticing.action.href}
            className="rounded-full bg-evergreen-900 px-3.5 py-1.5 text-[12px] font-medium text-[#E9EDE0] transition-colors hover:bg-evergreen-deep"
          >
            {noticing.action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onResume}
            className="rounded-full bg-evergreen-900 px-3.5 py-1.5 text-[12px] font-medium text-[#E9EDE0] transition-colors hover:bg-evergreen-deep"
          >
            {noticing.action.label}
          </button>
        )}
        <button
          type="button"
          onClick={onLater}
          className="rounded-full px-2.5 py-1.5 text-[12px] text-ink-600 transition-colors hover:text-ink-900"
        >
          Later
        </button>
      </div>
    </div>
  );
}

/* ── Tasks today (4×2) ── */

export function TasksCell({ className }: { className?: string }) {
  const tasks = useTaskStore((state) => state.tasks);
  const { toggleTask, addTask } = useTaskActions();
  const addToast = useToast();
  const [draft, setDraft] = useState("");

  const todayKey = getLocalDateKey();
  const open = useMemo(() => {
    const priorityScore = { high: 3, medium: 2, low: 1 } as const;
    return tasks
      .filter((t) => !t.completed)
      .sort((a, b) => {
        const aDue = a.dueDate ? getLocalDateKey(new Date(a.dueDate)) : "9999";
        const bDue = b.dueDate ? getLocalDateKey(new Date(b.dueDate)) : "9999";
        if (aDue !== bDue) return aDue.localeCompare(bDue);
        return priorityScore[b.priority] - priorityScore[a.priority];
      })
      .slice(0, 4);
  }, [tasks]);

  const doneToday = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.completed &&
          t.completedAt &&
          getLocalDateKey(new Date(t.completedAt)) === todayKey
      ),
    [tasks, todayKey]
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    addTask(draft.trim(), "medium", "quick");
    setDraft("");
  };

  const chipFor = (task: (typeof tasks)[number]) => {
    const due = task.dueDate ? getLocalDateKey(new Date(task.dueDate)) : null;
    if (due && due < todayKey) return { label: "overdue", cls: "bg-clay-bg text-clay-text" };
    if (due === todayKey) return { label: "today", cls: "bg-clay-bg text-clay-text" };
    if (task.sourceNodeId) return { label: "from map", cls: "bg-sage-surface text-green-800" };
    return { label: task.energy, cls: "bg-sunken text-ink-600" };
  };

  return (
    <Card className={cn("gap-0 p-0", className)}>
      <div className="px-5 pt-5">
        <CellHeader
          label="Tasks · Today"
          href="/tasks"
          hrefLabel="Open Tasks"
          right={
            <span className="font-mono text-[11px] text-ink-500">
              {doneToday.length}/{doneToday.length + open.length}
            </span>
          }
        />
      </div>

      <ul className="mt-2 flex-1 px-2">
        {open.length === 0 && doneToday.length === 0 && (
          <li className="px-3 py-8 text-center text-[13px] text-ink-500">
            Nothing held for today.
          </li>
        )}
        {open.map((task) => {
          const chip = chipFor(task);
          return (
            <li key={task.id}>
              <div className="group flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-colors hover:bg-[#FAF8F1]">
                <button
                  type="button"
                  onClick={() => {
                    toggleTask(task.id);
                    addToast("Done", "success");
                  }}
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border-[1.5px] border-ink-400 text-transparent transition-colors hover:border-green-800"
                  aria-label={`Mark "${task.title}" done`}
                >
                  <Check size={11} strokeWidth={3} />
                </button>
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink-700">
                  {task.title}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                    chip.cls
                  )}
                >
                  {chip.label}
                </span>
              </div>
            </li>
          );
        })}
        {doneToday.slice(0, 1).map((task) => (
          <li key={task.id}>
            <div className="flex items-center gap-3 rounded-[10px] px-3 py-2.5">
              <button
                type="button"
                onClick={() => toggleTask(task.id)}
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border-[1.5px] border-emerald-500 text-emerald-500"
                aria-label={`Reopen "${task.title}"`}
              >
                <Check size={11} strokeWidth={3} />
              </button>
              <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink-400 line-through">
                {task.title}
              </span>
              <span className="shrink-0 font-mono text-[10.5px] text-ink-400">
                done{" "}
                {task.completedAt
                  ? new Date(task.completedAt).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : ""}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="border-t border-line-soft px-5 py-3">
        <div className="flex items-center gap-2.5">
          <Plus size={14} className="shrink-0 text-ink-400" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add task — type anywhere"
            className="w-full bg-transparent text-[13px] text-ink-700 placeholder:text-ink-400 focus:outline-none"
            aria-label="Add a task"
          />
        </div>
      </form>
    </Card>
  );
}

/* ── Calendar (3×2) ── */

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

export function CalendarCell({ className }: { className?: string }) {
  const events = useCalendarEvents();
  const tasks = useTaskStore((state) => state.tasks);
  const todayKey = getLocalDateKey();

  const week = useMemo(() => {
    const now = new Date();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, []);

  const todayItems = useMemo(() => {
    const dayEvents = events
      .filter((e) => e.date === todayKey)
      .sort((a, b) => (a.start ?? "99").localeCompare(b.start ?? "99"))
      .map((e) => ({
        id: e.id,
        title: e.title,
        meta: [e.start, e.note].filter(Boolean).join(" · "),
        hold: e.type === "hold",
        task: false,
      }));
    const dueTasks = tasks
      .filter(
        (t) => !t.completed && t.dueDate && getLocalDateKey(new Date(t.dueDate)) === todayKey
      )
      .map((t) => ({
        id: t.id,
        title: t.title,
        meta: "before end of day",
        hold: false,
        task: true,
      }));
    return [...dayEvents, ...dueTasks].slice(0, 4);
  }, [events, tasks, todayKey]);

  return (
    <Card className={cn("gap-4", className)}>
      <CellHeader label="Calendar" href="/calendar" hrefLabel="Open Calendar" />

      {/* Week strip */}
      <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] text-ink-500">
        {week.map((day, i) => {
          const isToday = getLocalDateKey(day) === todayKey;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <span>{DAY_LETTERS[i]}</span>
              <span
                className={cn(
                  "flex h-[22px] w-[22px] items-center justify-center rounded-full",
                  isToday && "bg-evergreen-900 text-[#E9EDE0]"
                )}
              >
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        {todayItems.length === 0 ? (
          <p className="mt-2 font-serif text-[13.5px] italic leading-relaxed text-ink-500">
            Quiet hours before your first commitment.
          </p>
        ) : (
          todayItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "rounded-[9px] py-1.5 pl-2.5 pr-2",
                item.hold
                  ? "border border-dashed border-sage-dash bg-sage-surface/40"
                  : cn(
                      "border border-line-soft border-l-[2.5px] bg-paper",
                      item.task ? "border-l-ochre-500" : "border-l-emerald-500"
                    )
              )}
            >
              <p className="truncate text-[12.5px] font-semibold text-ink-900">
                {item.title}
              </p>
              {item.meta && <p className="mt-0.5 text-[10.5px] text-ink-500">{item.meta}</p>}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

/* ── Notes + Today's Focus (3×2, §7 substitution) ── */

export function NotesCell({ className }: { className?: string }) {
  const notes = useNotes();
  const { addNote } = useNoteActions();
  const tasks = useTaskStore((state) => state.tasks);
  const { dailyAnchor } = useFocusStore(
    useShallow((state) => ({ dailyAnchor: state.dailyAnchor }))
  );
  const { setDailyAnchor, setActiveTask, setDeepWorkMode } = useFocusStore(
    (state) => state.actions
  );
  const [focusDraft, setFocusDraft] = useState("");
  const [settingFocus, setSettingFocus] = useState(false);

  const latest = notes[0];
  const words = latest?.body ? latest.body.split(/\s+/).filter(Boolean).length : 0;

  // The focus line: the user's own anchor first, else the top open high task.
  const topHigh = tasks.find((t) => !t.completed && t.priority === "high");
  const focusText = dailyAnchor ?? topHigh?.title ?? null;

  const startSession = () => {
    if (!dailyAnchor && topHigh) setActiveTask(topHigh.id);
    setDeepWorkMode(true);
  };

  const commitFocus = (e: React.FormEvent) => {
    e.preventDefault();
    if (focusDraft.trim()) setDailyAnchor(focusDraft.trim());
    setFocusDraft("");
    setSettingFocus(false);
  };

  return (
    <Card className={cn("gap-0", className)}>
      <CellHeader label="Notes" href="/notes" hrefLabel="Open Notes" />

      {latest ? (
        <Link href="/notes" className="group mt-4 block flex-1">
          <div className="rounded-inner border border-line-soft bg-paper p-3.5 transition-colors group-hover:border-line-strong">
            <h4 className="truncate font-serif text-[16px] text-ink-900">
              {latest.title || "Untitled"}
            </h4>
            {latest.body && (
              <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-relaxed text-ink-600">
                {latest.body}
              </p>
            )}
          </div>
          <p className="mt-2 px-1 text-[11px] text-ink-500">
            edited {formatRelativeTime(latest.updatedAt)}
            {words > 0 ? ` · ${words.toLocaleString()} words` : ""}
          </p>
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => addNote()}
          className="mt-4 flex flex-1 flex-col items-start justify-center rounded-inner border border-dashed border-line-strong p-4 text-left transition-colors hover:border-ink-400"
        >
          <p className="font-serif text-[15px] text-ink-700">Nothing written yet.</p>
          <p className="mt-1 text-[12px] text-ink-500">Start a note — it lands here.</p>
        </button>
      )}

      {/* Today's Focus line (§7) */}
      <div className="mt-4 border-t border-line-soft pt-3.5">
        {settingFocus ? (
          <form onSubmit={commitFocus} className="flex items-center gap-2">
            <input
              autoFocus
              value={focusDraft}
              onChange={(e) => setFocusDraft(e.target.value)}
              onBlur={commitFocus}
              placeholder="One focus for today…"
              className="w-full bg-transparent font-serif text-[15px] text-ink-900 placeholder:text-ink-400 focus:outline-none"
              aria-label="Set today's focus"
            />
          </form>
        ) : focusText ? (
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 truncate font-serif text-[15px] text-ink-900">
              One focus: <em className="italic text-green-800">{focusText}</em>
            </p>
            <button
              type="button"
              onClick={startSession}
              className="flex shrink-0 items-center gap-1 text-[12px] font-medium text-ink-600 transition-colors hover:text-ink-900"
            >
              <Play size={11} />
              Start session
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSettingFocus(true)}
            className="font-serif text-[15px] text-ink-500 transition-colors hover:text-ink-900"
          >
            One focus: <em className="italic">name it.</em>
          </button>
        )}
      </div>
    </Card>
  );
}

/* ── Knowledge (2×1) ── */

const TYPE_BADGE: Record<SourceType, { label: string; className: string }> = {
  pdf: { label: "PDF", className: "bg-clay-bg text-clay-text" },
  yt: { label: "YT", className: "bg-sage-surface text-green-800" },
  web: { label: "WEB", className: "bg-sunken text-ink-600" },
};

export function KnowledgeCell({ className }: { className?: string }) {
  const sources = useKnowledgeSources();
  const newCount = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86_400_000;
    return sources.filter((s) => new Date(s.addedAt).getTime() > weekAgo).length;
  }, [sources]);

  return (
    <Card className={cn("gap-3", className)}>
      <CellHeader
        label="Knowledge"
        href="/knowledge"
        hrefLabel="Open Knowledge"
        right={
          newCount > 0 ? (
            <span className="text-[11px] font-medium text-emerald-600">{newCount} new</span>
          ) : undefined
        }
      />
      {sources.length === 0 ? (
        <p className="text-[12px] leading-relaxed text-ink-500">
          Drop a PDF anytime — sources live here.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sources.slice(0, 2).map((source) => {
            const badge = TYPE_BADGE[source.type];
            return (
              <li key={source.id}>
                <Link href="/knowledge" className="group flex items-center gap-2">
                  <span
                    className={cn(
                      "shrink-0 rounded-[4px] px-1 py-0.5 font-mono text-[9.5px] font-medium",
                      badge.className
                    )}
                  >
                    {badge.label}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink-700 group-hover:text-ink-900">
                    {source.title}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/* ── Goal (dark, 2×1) ── */

export function GoalCell({ className }: { className?: string }) {
  const kpis = useKPIStore((state) => state.kpis);
  const goal = useMemo(
    () =>
      [...kpis].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0],
    [kpis]
  );

  const month = new Date().toLocaleString("en-US", { month: "long" });
  const filled = goal ? Math.round(Math.min(goal.value / goal.target, 1) * 5) : 0;

  return (
    <Card variant="dark" className={cn("gap-3 overflow-hidden", className)}>
      <CellHeader
        dark
        label={`Goal · ${month}`}
        href="/kpi"
        hrefLabel="Open Goals"
      />
      {goal ? (
        <>
          <p className="line-clamp-2 font-serif text-[15.5px] leading-[1.35] text-[#E9EDE0]">
            {goal.label}
          </p>
          <div className="mt-auto">
            <div className="flex gap-1" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-[5px] flex-1 rounded-full",
                    i < filled ? "bg-emerald-500" : "bg-[rgba(233,237,224,0.14)]"
                  )}
                />
              ))}
            </div>
            <p className="mt-2 font-mono text-[10.5px] text-rail-muted">
              {goal.value.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
            </p>
          </div>
        </>
      ) : (
        <p className="font-serif text-[15.5px] leading-[1.35] text-[#E9EDE0]">
          Track one number that matters.
        </p>
      )}
    </Card>
  );
}

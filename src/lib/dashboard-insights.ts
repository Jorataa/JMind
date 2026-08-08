import { Task } from "@/types/tasks";
import type { CalendarEvent } from "@/stores/use-calendar-store";
import type { KPI } from "@/types/kpi";
import { getLocalDateKey } from "@/lib/format-date";

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  if (hour < 21) return "Evening";
  return "Late night";
}

export function getProductivityInsight(tasks: Task[]) {
  const completedToday = tasks.filter(t =>
    t.completed && t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString()
  ).length;

  if (completedToday === 0) {
    if (tasks.length > 0) return "A few things are waiting whenever you're ready.";
    return "A quiet start. Name one thing worth moving today.";
  }

  if (completedToday > 5) return "A lot came together today.";
  const noun = completedToday === 1 ? "thing" : "things";
  return `${completedToday} ${noun} off your mind today.`;
}

/* ── Jorata's brief (hero cell, mockup #3a) ─────────────────────────
   One serif sentence with a single emphasized clause, composed from what
   is actually true today. Never invented, never a metric dump. */

export interface DayBrief {
  pre: string;
  /** The italic emerald clause. */
  em?: string;
  post: string;
}

const truncate = (text: string, max = 42) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

export function composeBrief(
  tasks: Task[],
  todayEvents: CalendarEvent[],
  isFreshWorkspace: boolean
): DayBrief {
  if (isFreshWorkspace) {
    return { pre: "", em: "Your mind, one quiet place.", post: " Start with a thought." };
  }

  const todayKey = getLocalDateKey();
  const open = tasks.filter((t) => !t.completed);
  const dueToday = open.filter(
    (t) => t.dueDate && getLocalDateKey(new Date(t.dueDate)) <= todayKey
  );
  const firstEvent = todayEvents
    .filter((e) => e.start)
    .sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""))[0];
  const completedToday = tasks.filter(
    (t) =>
      t.completed &&
      t.completedAt &&
      getLocalDateKey(new Date(t.completedAt)) === todayKey
  ).length;

  if (dueToday.length > 0 && firstEvent) {
    return {
      pre: "",
      em: truncate(dueToday[0].title),
      post: ` is today's decision — and ${firstEvent.title} is at ${firstEvent.start}.`,
    };
  }
  if (dueToday.length > 0) {
    return {
      pre: "",
      em: truncate(dueToday[0].title),
      post:
        dueToday.length > 1
          ? ` is first of ${dueToday.length} due today.`
          : " is the one to move today.",
    };
  }
  if (firstEvent) {
    return {
      pre: "The day is clear until ",
      em: firstEvent.title,
      post: ` at ${firstEvent.start}.`,
    };
  }
  if (completedToday > 0) {
    return {
      pre: "",
      em: `${completedToday} ${completedToday === 1 ? "thing" : "things"}`,
      post: " off your mind already — what's next?",
    };
  }
  if (open.length > 0) {
    return {
      pre: "A quiet start — ",
      em: "one decision",
      post: " would set the day's direction.",
    };
  }
  return { pre: "Nothing is pressing. ", em: "Think first", post: ", then commit." };
}

/* ── Noticings (§5.3) ───────────────────────────────────────────────
   Max three ambient observations, derived locally from real state — never
   toasts, never badges. "Later" dismisses for the session. */

export interface Noticing {
  id: string;
  pre: string;
  em?: string;
  post?: string;
  action: { label: string; href: string } | { label: string; kind: "resume-focus" };
}

export function deriveNoticings(input: {
  tasks: Task[];
  inboxCount: number;
  activeMap?: { title: string; updatedAt: string };
  kpis: KPI[];
  focus: { activeTaskId: string | null; deepWorkMode: boolean };
}): Noticing[] {
  const { tasks, inboxCount, activeMap, kpis, focus } = input;
  const noticings: Noticing[] = [];
  const now = Date.now();
  const todayKey = getLocalDateKey();

  // 1 — an interrupted focus thread is the most valuable thing to hand back.
  if (focus.activeTaskId && !focus.deepWorkMode) {
    const task = tasks.find((t) => t.id === focus.activeTaskId && !t.completed);
    if (task) {
      noticings.push({
        id: "resume-task",
        pre: "",
        em: truncate(task.title),
        post: " is still yours from earlier — pick it back up?",
        action: { label: "Resume focus", kind: "resume-focus" },
      });
    }
  }

  // 2 — overdue tasks (strictly before today).
  const overdue = tasks.filter(
    (t) =>
      !t.completed && t.dueDate && getLocalDateKey(new Date(t.dueDate)) < todayKey
  );
  if (overdue.length > 0) {
    noticings.push({
      id: "overdue",
      pre: "",
      em:
        overdue.length === 1
          ? truncate(overdue[0].title)
          : `${overdue.length} tasks`,
      post:
        overdue.length === 1
          ? " slipped past its date — reschedule or release it."
          : " slipped past their dates — reschedule or release them.",
      action: { label: "Open tasks", href: "/tasks" },
    });
  }

  // 3 — a piling inbox.
  if (inboxCount >= 3) {
    noticings.push({
      id: "inbox-pile",
      pre: "",
      em: `${inboxCount} captures`,
      post: " are waiting in the Inbox.",
      action: { label: "Triage", href: "/inbox" },
    });
  }

  // 4 — the active map has gone quiet.
  if (activeMap) {
    const days = Math.floor(
      (now - new Date(activeMap.updatedAt).getTime()) / 86_400_000
    );
    if (days >= 5) {
      noticings.push({
        id: "quiet-map",
        pre: "The ",
        em: truncate(activeMap.title, 32),
        post: ` map has been quiet ${days} days — still the main thread?`,
        action: { label: "Open map", href: "/mindmap" },
      });
    }
  }

  // 5 — a goal nobody is feeding.
  const quietGoal = kpis.find(
    (k) => now - new Date(k.updatedAt).getTime() > 7 * 86_400_000
  );
  if (quietGoal) {
    const days = Math.floor(
      (now - new Date(quietGoal.updatedAt).getTime()) / 86_400_000
    );
    noticings.push({
      id: `quiet-goal-${quietGoal.id}`,
      pre: "",
      em: truncate(quietGoal.label, 32),
      post: ` hasn't moved in ${days} days.`,
      action: { label: "Log progress", href: "/kpi" },
    });
  }

  return noticings.slice(0, 3);
}

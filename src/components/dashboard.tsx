import MindMapCanvas from "@/features/mindmap/MindMapCanvas";
import TaskPanel from "@/features/tasks/TaskPanel";
import type { ReactNode } from "react";

type StatCard = {
  label: string;
  value: string;
  delta: string;
  tone: "emerald" | "amber" | "sky";
  icon: ReactNode;
};

const statCards: StatCard[] = [
  {
    label: "Tasks",
    value: "Today",
    delta: "Capture, finish, repeat",
    tone: "emerald",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="2"
          y="2"
          width="14"
          height="14"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M6 9L8 11L12 7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Mind Maps",
    value: "Visual",
    delta: "Thinking stays connected",
    tone: "sky",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="9" cy="9" r="2.5" fill="currentColor" />
        <circle
          cx="3"
          cy="3.5"
          r="1.5"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <circle
          cx="15"
          cy="3.5"
          r="1.5"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <circle
          cx="3"
          cy="14.5"
          r="1.5"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <circle
          cx="15"
          cy="14.5"
          r="1.5"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <line
          x1="6.5"
          y1="7"
          x2="4.2"
          y2="4.8"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <line
          x1="11.5"
          y1="7"
          x2="13.8"
          y2="4.8"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <line
          x1="6.5"
          y1="11"
          x2="4.2"
          y2="13.2"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <line
          x1="11.5"
          y1="11"
          x2="13.8"
          y2="13.2"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "MVP Focus",
    value: "v0.1",
    delta: "Dashboard, tasks, maps",
    tone: "amber",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polyline
          points="2,14 6,9 9,11 13,5 16,7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="16" cy="7" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
];

const weeklyBars = [42, 68, 54, 78, 62, 86, 74];
const recentActivity = [
  "Task system now saves locally",
  "Mind map persistence is active",
  "Dashboard MVP focus is dashboard, tasks, maps",
];

function StatCardComponent({ card }: { card: StatCard }) {
  const toneClass = {
    emerald: "bg-emerald-300/10 text-emerald-300 ring-emerald-300/15",
    amber: "bg-amber-300/10 text-amber-200 ring-amber-300/15",
    sky: "bg-sky-300/10 text-sky-300 ring-sky-300/15",
  }[card.tone];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-5 shadow-sm shadow-black/10 transition-colors hover:bg-white/[0.06]">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium uppercase tracking-wider text-zinc-500">
          {card.label}
        </span>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 ${toneClass}`}
        >
          {card.icon}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[28px] font-semibold leading-none tracking-tight text-zinc-50">
          {card.value}
        </span>
        <span className="text-[12px] font-medium text-zinc-500">
          {card.delta}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <section className="grid gap-4 lg:grid-cols-[1.45fr_0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.18),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-2xl shadow-black/20">
          <div className="mb-8 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            <span className="text-[12px] font-medium uppercase tracking-widest text-emerald-200/80">
              Student Operating System
            </span>
          </div>
          <div className="max-w-2xl">
            <h2 className="text-[30px] font-semibold leading-tight tracking-tight text-zinc-50 sm:text-[36px]">
              Build today around one clear mission.
            </h2>
            <p className="mt-3 max-w-xl text-[14px] leading-6 text-zinc-400">
              Capture loose thoughts, turn them into tasks, and keep your map
              close so planning and execution stay connected.
            </p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-zinc-950/35 p-4">
              <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
                Today Focus
              </p>
              <p className="mt-2 text-[14px] font-medium text-zinc-100">
                Finish the next important task
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-950/35 p-4">
              <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
                Energy
              </p>
              <p className="mt-2 text-[14px] font-medium text-zinc-100">
                Deep work before admin work
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-950/35 p-4">
              <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
                Review
              </p>
              <p className="mt-2 text-[14px] font-medium text-zinc-100">
                Measure progress tonight
              </p>
            </div>
          </div>
        </div>

        <aside className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[13px] font-semibold text-zinc-100">
              Weekly Pulse
            </h3>
            <span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200">
              4 day streak
            </span>
          </div>
          <div className="mt-6 flex items-end gap-2">
            {weeklyBars.map((height, index) => (
              <span
                key={index}
                className="flex-1 rounded-t-md bg-gradient-to-t from-emerald-400/30 to-emerald-200"
                style={{ height: `${height}px` }}
              />
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/35 p-4">
            <p className="text-[12px] leading-5 text-zinc-400">
              Momentum comes from finishing small, meaningful actions daily.
              Keep the system light and keep moving.
            </p>
          </div>
        </aside>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
          Overview
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card) => (
            <StatCardComponent key={card.label} card={card} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
              Execution
            </h3>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-zinc-400">
              Local
            </span>
          </div>
          <TaskPanel />
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Recent Activity
          </h3>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            {recentActivity.map((activity) => (
              <div
                key={activity}
                className="flex gap-3 border-b border-white/10 py-3 first:pt-0 last:border-b-0 last:pb-0"
              >
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" />
                <p className="text-[13px] leading-5 text-zinc-300">
                  {activity}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Visual Thinking
          </h3>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-zinc-400">
            Interactive
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
          <MindMapCanvas />
        </div>
      </section>
    </div>
  );
}

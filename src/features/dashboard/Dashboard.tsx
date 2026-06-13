"use client";

import MindMapPreview from "@/features/dashboard/components/MindMapPreview";
import TodayFocus from "@/features/dashboard/components/TodayFocus";
import KPIQuickAccess from "@/features/dashboard/components/KPIQuickAccess";
import QuickCapture from "@/features/dashboard/components/QuickCapture";
import GettingStarted from "@/features/dashboard/components/GettingStarted";
import WisdomCard from "@/features/wisdom/components/WisdomCard";
import ProductivityScore from "@/features/analytics/components/ProductivityScore";
import WeeklyPulse from "@/features/analytics/components/WeeklyPulse";
import DashboardHeader from "@/features/dashboard/components/DashboardHeader";
import ContinuityBridge from "@/features/dashboard/components/ContinuityBridge";
import RecentActivity from "@/features/dashboard/components/RecentActivity";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useAnalytics } from "@/hooks/use-analytics";
import { useHydrated } from "@/hooks/use-hydrated";
import { StatSummary } from "@/features/analytics/components/StatSummary";
import { Zap, Activity as ActivityIcon, CheckSquare, Target } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useActivities } from "@/stores/use-activity-store";
import { useTaskStore } from "@/stores/use-task-store";
import { useKPIStore } from "@/stores/use-kpi-store";
import { useMindMapNodes } from "@/stores/use-mindmap-store";
import { useInbox } from "@/stores/use-inbox-store";
import { useSessionContinuity } from "@/hooks/use-session-continuity";

export default function Dashboard() {
  useSessionContinuity();

  const {
    productivityScore,
    streak,
    velocity,
    taskCompletionRate,
    taskStats
  } = useAnalytics();

  const isHydrated = useHydrated();
  const activities = useActivities();
  const tasks = useTaskStore((state) => state.tasks);
  const kpis = useKPIStore((state) => state.kpis);
  const nodes = useMindMapNodes();
  const inboxItems = useInbox();
  const recentActivities = activities.slice(0, 10);

  // A brand-new workspace gets guidance, not a wall of zero-metrics.
  const isFreshWorkspace =
    tasks.length === 0 &&
    kpis.length === 0 &&
    activities.length === 0 &&
    inboxItems.length === 0 &&
    nodes.length <= 1;

  // Analytics only earn their place once there is something to measure.
  const hasExecutionData = tasks.length > 0 || kpis.length > 0;

  if (!isHydrated) {
    return (
      <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full animate-pulse">
        <Card className="h-48 bg-white/[0.02]" />
        <Card className="h-64 bg-white/[0.02]" />
        <Card className="h-96 bg-white/[0.02]" />
      </div>
    );
  }

  if (isFreshWorkspace) {
    return (
      <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
        <DashboardHeader />
        <GettingStarted />

        <section className="grid gap-6 lg:grid-cols-2">
          <WisdomCard />
          <div className="flex flex-col gap-3">
            <SectionTitle>Visual Thinking</SectionTitle>
            <MindMapPreview />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
      {/* Hero & Insights */}
      <section className="flex flex-col gap-6">
        {hasExecutionData ? (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <DashboardHeader />
            <WeeklyPulse />
          </div>
        ) : (
          <DashboardHeader />
        )}
        <ContinuityBridge />
      </section>

      {/* Mental Focus & Productivity */}
      {hasExecutionData ? (
        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <WisdomCard />
          <ProductivityScore />
        </section>
      ) : (
        // Mid-state (no tasks/KPIs yet): pair Wisdom with the map preview so a
        // half-full board reads as composed, not a quote stretched edge-to-edge.
        <section className="grid gap-6 lg:grid-cols-2">
          <WisdomCard />
          <div className="flex flex-col gap-3">
            <SectionTitle>Visual Thinking</SectionTitle>
            <MindMapPreview />
          </div>
        </section>
      )}

      {/* Intelligence Cards */}
      {hasExecutionData && (
        <section className="flex flex-col gap-4">
          <SectionTitle>Intelligence Overview</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatSummary
              label="Productivity"
              value={`${productivityScore}%`}
              description="Daily aggregate score"
              icon={<Zap size={18} />}
              color="emerald"
            />
            <StatSummary
              label="Streak"
              value={streak}
              description="Consecutive focus days"
              icon={<ActivityIcon size={18} />}
              color="amber"
            />
            <StatSummary
              label="Velocity"
              value={velocity}
              description="Tasks completed per day"
              icon={<CheckSquare size={18} />}
              color="sky"
            />
            <StatSummary
              label="Completion"
              value={`${taskCompletionRate}%`}
              description={`${taskStats.completed}/${taskStats.total} objectives done`}
              icon={<Target size={18} />}
              color="violet"
            />
          </div>
        </section>
      )}

      {/* Execution & Intelligence */}
      <section className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <SectionTitle>Active Execution</SectionTitle>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Primary Loop
              </span>
            </div>
            <TodayFocus />
          </div>

          <div className="flex flex-col gap-3">
            <SectionTitle>Performance Metrics</SectionTitle>
            <KPIQuickAccess />
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <RecentActivity activities={recentActivities} />
          <QuickCapture />
        </div>
      </section>

      {/* Visual Thinking — full state keeps it at the bottom; the mid-state
          pairs it with Daily Wisdom above, so the preview is never shown twice. */}
      {hasExecutionData && (
        <section className="flex flex-col gap-3">
          <SectionTitle>Visual Thinking</SectionTitle>
          <MindMapPreview />
        </section>
      )}
    </div>
  );
}

"use client";

import MindMapPreview from "@/features/dashboard/components/MindMapPreview";
import TodayFocus from "@/features/dashboard/components/TodayFocus";
import KPIQuickAccess from "@/features/dashboard/components/KPIQuickAccess";
import QuickCapture from "@/features/dashboard/components/QuickCapture";
import GettingStarted from "@/features/dashboard/components/GettingStarted";
import WisdomCard from "@/features/wisdom/components/WisdomCard";
import WeeklyPulse from "@/features/analytics/components/WeeklyPulse";
import DashboardHeader from "@/features/dashboard/components/DashboardHeader";
import ContinuityBridge from "@/features/dashboard/components/ContinuityBridge";
import RecentActivity from "@/features/dashboard/components/RecentActivity";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useHydrated } from "@/hooks/use-hydrated";
import { Card } from "@/components/ui/Card";
import { useActivities } from "@/stores/use-activity-store";
import { useTaskStore } from "@/stores/use-task-store";
import { useKPIStore } from "@/stores/use-kpi-store";
import { useMindMapNodes } from "@/stores/use-mindmap-store";
import { useInbox } from "@/stores/use-inbox-store";
import { useSessionContinuity } from "@/hooks/use-session-continuity";

export default function Dashboard() {
  useSessionContinuity();

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

  // The weekly chart only earns its place once there is something to measure.
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
      {/* Greeting & anchor */}
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

      {/* Wisdom + the map preview, paired in every state so a quote never sits
          stretched edge-to-edge and the canvas stays close at hand. */}
      <section className="grid gap-6 lg:grid-cols-2">
        <WisdomCard />
        <div className="flex flex-col gap-3">
          <SectionTitle>Visual Thinking</SectionTitle>
          <MindMapPreview />
        </div>
      </section>

      {/* Your day & a place to capture */}
      <section className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-8">
          <TodayFocus />

          <div className="flex flex-col gap-3">
            <SectionTitle>Goals</SectionTitle>
            <KPIQuickAccess />
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <RecentActivity activities={recentActivities} />
          <QuickCapture />
        </div>
      </section>
    </div>
  );
}

"use client";

import MindMapCanvas from "@/features/mindmap/MindMapCanvas";
import TaskPanel from "@/features/tasks/TaskPanel";
import WisdomCard from "@/features/wisdom/components/WisdomCard";
import ProductivityScore from "@/features/analytics/components/ProductivityScore";
import WeeklyPulse from "@/features/analytics/components/WeeklyPulse";
import DashboardHeader from "@/features/dashboard/components/DashboardHeader";
import RecentActivity from "@/features/dashboard/components/RecentActivity";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useAnalytics } from "@/hooks/use-analytics";
import { StatSummary } from "@/features/analytics/components/StatSummary";
import { Zap, Activity, CheckSquare, Target } from "lucide-react";

export default function Dashboard() {
  const { 
    productivityScore, 
    streak, 
    velocity, 
    taskCompletionRate,
    taskStats 
  } = useAnalytics();

  const recentActivity = [
    "Task system now saves locally",
    "Mind map persistence is active",
    "Analytics engine calculating live scores",
  ];

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
      {/* Hero & Insights */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <DashboardHeader />
        <WeeklyPulse />
      </section>

      {/* Mental Focus & Productivity */}
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <WisdomCard />
        <ProductivityScore />
      </section>

      {/* Intelligence Cards */}
      <section className="flex flex-col gap-4">
        <SectionTitle>Intelligence Overview</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatSummary
            label="Productivity"
            value={`${productivityScore}%`}
            description="Daily aggregate score"
            icon={<Zap size={18} />}
            color="emerald"
            trend={{ value: 12, isUp: true }}
          />
          <StatSummary
            label="Streak"
            value={streak}
            description="Consecutive focus days"
            icon={<Activity size={18} />}
            color="amber"
            trend={{ value: 2, isUp: true }}
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

      {/* Execution & Activity */}
      <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <SectionTitle>Active Execution</SectionTitle>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Live Engine
            </span>
          </div>
          <TaskPanel />
        </div>

        <RecentActivity activities={recentActivity} />
      </section>

      {/* Visual Thinking */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <SectionTitle>Visual Thinking</SectionTitle>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Infinite Canvas
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/40">
          <MindMapCanvas />
        </div>
      </section>

      {/* Footer Branding */}
      <div className="pt-8 border-t border-white/5">
        <div className="flex items-center justify-center py-12 text-center flex-col gap-2 opacity-30">
          <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Zap size={16} fill="currentColor" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-zinc-500">
            JMind OS — Professional Edition Active
          </p>
        </div>
      </div>
    </div>
  );
}

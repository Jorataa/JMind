"use client";

import { useTaskStore } from "@/stores/use-task-store";
import { useKPIStore } from "@/stores/use-kpi-store";
import { getWeeklyCompletionData, calculateStreak } from "@/lib/analytics-engine";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useMemo } from "react";
import { cn } from "@/lib/cn";

export default function WeeklyPulse() {
  const tasks = useTaskStore((state) => state.tasks);
  const kpis = useKPIStore((state) => state.kpis);

  const weeklyData = useMemo(() => getWeeklyCompletionData(tasks, kpis), [tasks, kpis]);
  const streak = useMemo(() => calculateStreak(tasks), [tasks]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <SectionTitle>Weekly Pulse</SectionTitle>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-400/20">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          {streak} day streak
        </div>
      </div>

      <div className="flex items-end gap-3 h-[100px]">
        {weeklyData.map((day, index) => {
          const height = Math.max((day.score / 100) * 80, 4); // Min 4px
          const isToday = index === weeklyData.length - 1;

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="relative w-full flex items-end justify-center h-full">
                <div 
                  className={cn(
                    "w-full rounded-t-md transition-all duration-500 ease-out group-hover:opacity-80",
                    isToday 
                      ? "bg-gradient-to-t from-emerald-500 to-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]" 
                      : "bg-white/10"
                  )}
                  style={{ height: `${height}px` }}
                />
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-tight",
                isToday ? "text-emerald-400" : "text-zinc-600"
              )}>
                {day.date}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

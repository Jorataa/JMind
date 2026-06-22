"use client";

import { useTaskStore } from "@/stores/use-task-store";
import { useKPIStore } from "@/stores/use-kpi-store";
import { getWeeklyCompletionData } from "@/lib/analytics-engine";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useMemo } from "react";
import { cn } from "@/lib/cn";

export default function WeeklyPulse() {
  const tasks = useTaskStore((state) => state.tasks);
  const kpis = useKPIStore((state) => state.kpis);

  const weeklyData = useMemo(() => getWeeklyCompletionData(tasks, kpis), [tasks, kpis]);

  return (
    <Card className="p-6">
      <div className="mb-6">
        <SectionTitle>This Week</SectionTitle>
      </div>

      <div className="flex items-end gap-3 h-[100px]">
        {weeklyData.map((day, index) => {
          const height = Math.max((day.value / 100) * 80, 4); // Min 4px
          const isToday = index === weeklyData.length - 1;

          return (
            <div key={day.name} className="flex-1 flex flex-col items-center gap-2 group">
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
                {day.name}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

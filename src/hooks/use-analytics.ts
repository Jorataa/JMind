"use client";

import { useMemo } from "react";
import { useTaskStore } from "@/stores/use-task-store";
import { useKPIStore } from "@/stores/use-kpi-store";
import {
  calculateProductivityScore,
  calculateStreak,
  calculateTaskVelocity,
  calculateDeepWorkRatio,
  getWeeklyCompletionData,
} from "@/lib/analytics-engine";

export function useAnalytics() {
  const tasks = useTaskStore((state) => state.tasks);
  const kpis = useKPIStore((state) => state.kpis);

  return useMemo(() => {
    const productivityScore = calculateProductivityScore(tasks, kpis);
    const streak = calculateStreak(tasks);
    const velocity = calculateTaskVelocity(tasks);
    const deepWorkRatio = calculateDeepWorkRatio(tasks);
    const weeklyData = getWeeklyCompletionData(tasks);

    const completedTasks = tasks.filter((t) => t.completed).length;
    const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const activeKPIs = kpis.length;
    const kpiCompletionRate = kpis.length > 0
      ? Math.round(kpis.reduce((acc, k) => acc + Math.min((k.value / k.target) * 100, 100), 0) / kpis.length)
      : 0;

    return {
      productivityScore,
      streak,
      velocity,
      deepWorkRatio,
      weeklyData,
      taskCompletionRate,
      kpiCompletionRate,
      taskStats: {
        total: tasks.length,
        completed: completedTasks,
        pending: tasks.length - completedTasks,
      },
      kpiStats: {
        total: activeKPIs,
      },
    };
  }, [tasks, kpis]);
}

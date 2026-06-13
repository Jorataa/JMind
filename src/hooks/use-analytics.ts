"use client";

import { useMemo } from "react";
import { useTaskStore } from "@/stores/use-task-store";
import { useKPIStore } from "@/stores/use-kpi-store";
import {
  calculateTaskVelocity,
  calculateDeepWorkRatio,
  getWeeklyCompletionData,
  calculateTaskCompletionRate,
  calculateKPICompletionRate,
} from "@/lib/analytics-engine";

export function useAnalytics() {
  const tasks = useTaskStore((state) => state.tasks);
  const kpis = useKPIStore((state) => state.kpis);

  return useMemo(() => {
    const velocity = calculateTaskVelocity(tasks);
    const deepWorkRatio = calculateDeepWorkRatio(tasks);
    const weeklyData = getWeeklyCompletionData(tasks, kpis);

    const taskCompletionRate = calculateTaskCompletionRate(tasks);
    const kpiCompletionRate = calculateKPICompletionRate(kpis);

    const completedTasks = tasks.filter((t) => t.completed).length;

    return {
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
        total: kpis.length,
      },
    };
  }, [tasks, kpis]);
}

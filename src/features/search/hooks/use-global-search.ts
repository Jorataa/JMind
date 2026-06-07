"use client";

import { useMemo } from "react";
import { useTaskStore } from "@/stores/use-task-store";
import { useKPIStore } from "@/stores/use-kpi-store";

export function useGlobalSearch(query: string) {
  const tasks = useTaskStore((state) => state.tasks);
  const kpis = useKPIStore((state) => state.kpis);

  return useMemo(() => {
    if (!query.trim()) return { tasks: [], kpis: [] };

    const q = query.toLowerCase();

    return {
      tasks: tasks.filter(t => t.title.toLowerCase().includes(q)).slice(0, 5),
      kpis: kpis.filter(k => k.label.toLowerCase().includes(q)).slice(0, 5),
    };
  }, [tasks, kpis, query]);
}

"use client";

import { useTaskStore } from "@/stores/use-task-store";
import { useKPIStore } from "@/stores/use-kpi-store";
import { calculateProductivityScore } from "@/lib/analytics-engine";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Badge } from "@/components/ui/Badge";
import { useMemo } from "react";

export default function ProductivityScore() {
  const tasks = useTaskStore((state) => state.tasks);
  const kpis = useKPIStore((state) => state.kpis);

  const score = useMemo(() => calculateProductivityScore(tasks, kpis), [tasks, kpis]);

  const label = useMemo(() => {
    if (score >= 90) return { text: "Elite", variant: "violet" as const };
    if (score >= 70) return { text: "High", variant: "emerald" as const };
    if (score >= 40) return { text: "Steady", variant: "sky" as const };
    return { text: "Starting", variant: "zinc" as const };
  }, [score]);

  return (
    <Card className="flex-row items-center gap-6 p-6">
      <ProgressRing progress={score} size={80} stroke={8} />
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="text-[18px] font-semibold text-zinc-50">Productivity Score</h3>
          <Badge variant={label.variant}>{label.text}</Badge>
        </div>
        <p className="text-[13px] text-zinc-500 max-w-[200px]">
          Based on today&apos;s task completion and KPI progress.
        </p>
      </div>
    </Card>
  );
}

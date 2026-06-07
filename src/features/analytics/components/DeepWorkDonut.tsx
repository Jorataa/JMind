"use client";

import { useAnalytics } from "@/hooks/use-analytics";
import { DonutChart } from "@/components/charts/DonutChart";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";

export default function DeepWorkDonut() {
  const { deepWorkRatio, taskStats } = useAnalytics();

  const data = [
    { name: "Deep Focus", value: deepWorkRatio },
    { name: "Other", value: 100 - deepWorkRatio },
  ];

  if (taskStats.completed === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Deep Work Ratio</SectionTitle>
      <Card className="p-6 flex flex-col items-center justify-center min-h-[320px]">
        <DonutChart data={data} height={240} />
        <div className="mt-4 text-center">
          <p className="text-[13px] font-bold text-zinc-100">{deepWorkRatio}% High Intensity</p>
          <p className="text-[11px] text-zinc-500">Based on recent completions</p>
        </div>
      </Card>
    </div>
  );
}

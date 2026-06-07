"use client";

import { useAnalytics } from "@/hooks/use-analytics";
import { AreaChart } from "@/components/charts/AreaChart";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";

export default function WeeklyFocusChart() {
  const { weeklyData } = useAnalytics();

  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Weekly Velocity</SectionTitle>
      <Card className="p-6">
        <div className="mb-4">
          <p className="text-[13px] text-zinc-400">
            Task completion trends over the last 7 days.
          </p>
        </div>
        <AreaChart data={weeklyData} color="emerald" height={240} />
      </Card>
    </div>
  );
}

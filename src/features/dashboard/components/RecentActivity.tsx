import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";

interface RecentActivityProps {
  activities: string[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Recent Activity</SectionTitle>
      <Card className="p-2 gap-0 divide-y divide-white/5">
        {activities.map((activity) => (
          <div
            key={activity}
            className="flex items-start gap-3 p-4 transition-colors hover:bg-white/[0.02]"
          >
            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
            <p className="text-[13px] leading-relaxed text-zinc-300">
              {activity}
            </p>
          </div>
        ))}
      </Card>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Activity } from "@/types/activity";
import { formatRelativeTime } from "@/lib/format-date";
import { CheckCircle2, PlusCircle, Brain, Target, MessageSquare, ArrowRightCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { useMindMapActions } from "@/stores/use-mindmap-store";

interface RecentActivityProps {
  activities: Activity[];
}

const activityIcons: Record<Activity['type'], React.ReactNode> = {
  task_created: <PlusCircle size={14} className="text-sky-400" />,
  task_completed: <CheckCircle2 size={14} className="text-emerald-400" />,
  task_uncompleted: <ArrowRightCircle size={14} className="text-zinc-500" />,
  node_created: <Brain size={14} className="text-violet-400" />,
  node_converted: <Target size={14} className="text-amber-400" />,
  kpi_updated: <Target size={14} className="text-rose-400" />,
  mindset_reflection: <MessageSquare size={14} className="text-indigo-400" />,
};

export default function RecentActivity({ activities }: RecentActivityProps) {
  const router = useRouter();
  const { switchMap, requestNodeFocus } = useMindMapActions();

  // Where an activity leads when clicked, or null if it has no distinct place
  // to go (a reflection lives on this page already).
  const navFor = (activity: Activity): (() => void) | null => {
    const meta = activity.metadata ?? {};
    switch (activity.type) {
      case "node_created":
      case "node_converted": {
        const nodeId = typeof meta.nodeId === "string" ? meta.nodeId : null;
        if (!nodeId) return null;
        return () => {
          if (typeof meta.mapId === "string") switchMap(meta.mapId);
          requestNodeFocus(nodeId);
          router.push("/mindmap");
        };
      }
      case "task_created":
      case "task_completed":
      case "task_uncompleted":
        return () => router.push("/tasks");
      case "kpi_updated":
        return () => router.push("/kpi");
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Recent Activity</SectionTitle>
      <Card className="p-2 gap-0 divide-y divide-white/5 bg-zinc-900/30">
        {activities.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[13px] text-zinc-600 italic">No activity recorded yet. Start taking action!</p>
          </div>
        ) : (
          activities.map((activity) => {
            const onNavigate = navFor(activity);
            const body = (
              <>
                <div className="mt-0.5 shrink-0">
                  {activityIcons[activity.type]}
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <p className={cn(
                    "text-[13px] leading-snug text-zinc-300 truncate",
                    activity.type === 'task_completed' && "text-zinc-400"
                  )}>
                    {activity.label}
                  </p>
                  <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-600">
                    {formatRelativeTime(activity.timestamp)}
                  </span>
                </div>
              </>
            );

            return onNavigate ? (
              <button
                key={activity.id}
                type="button"
                onClick={onNavigate}
                className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-white/[0.03]"
              >
                {body}
              </button>
            ) : (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-4"
              >
                {body}
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}

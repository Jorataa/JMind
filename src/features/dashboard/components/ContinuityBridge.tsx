"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useFocus } from "@/stores/use-focus-store";
import { useFocusActions } from "@/stores/use-focus-store";
import { useTaskStore } from "@/stores/use-task-store";
import { useInbox } from "@/stores/use-inbox-store";
import { Zap, Target, Inbox, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import { useUIActions } from "@/stores/use-ui-store";

export default function ContinuityBridge() {
  const { dailyAnchor, anchorCompleted, deepWorkMode, activeTaskId } = useFocus();
  const { setActiveTask, setDeepWorkMode } = useFocusActions();
  const { setQuickCaptureOpen } = useUIActions();
  const tasks = useTaskStore((state) => state.tasks);
  const inboxItems = useInbox();

  const activeTask = activeTaskId ? tasks.find(t => t.id === activeTaskId) : null;
  const hasActiveSession = deepWorkMode || (activeTask && !activeTask.completed) || (dailyAnchor && !anchorCompleted) || inboxItems.length > 0;

  if (!hasActiveSession) return null;

  const beginFocus = (taskId: string | null = null) => {
    setActiveTask(taskId);
    setDeepWorkMode(true);
  };

  const processInbox = () => {
    const inboxPanel = document.getElementById("quick-capture");

    if (inboxPanel) {
      inboxPanel.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setQuickCaptureOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
          Pick up where you left off
        </h3>
        <span className="h-px flex-1 mx-4 bg-white/5" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Deep Work Resumption */}
        <AnimatePresence>
          {deepWorkMode && (
            <ContinuityCard
              icon={<Zap className="text-emerald-400" size={18} />}
              title="Focus Session Active"
              description="Your focus session is still open."
              actionLabel="Resume Session"
              color="emerald"
              onClick={() => beginFocus(activeTask?.id ?? null)}
            />
          )}

          {/* Active Task Resumption */}
          {activeTask && !activeTask.completed && !deepWorkMode && (
            <ContinuityCard
              icon={<Play className="text-sky-400" size={18} />}
              title="Resume Focus"
              description={activeTask.title}
              actionLabel="Continue Task"
              color="sky"
              onClick={() => beginFocus(activeTask.id)}
            />
          )}

          {/* Daily Anchor Focus */}
          {dailyAnchor && !anchorCompleted && !activeTaskId && (
            <ContinuityCard
              icon={<Target className="text-amber-400" size={18} />}
              title="Today's Focus"
              description={dailyAnchor}
              actionLabel="Focus Now"
              color="amber"
              onClick={() => beginFocus(null)}
            />
          )}

          {/* Inbox Processing */}
          {inboxItems.length > 0 && (
            <ContinuityCard
              icon={<Inbox className="text-violet-400" size={18} />}
              title="Notes to Sort"
              description={`You have ${inboxItems.length} items in your inbox.`}
              actionLabel="Sort Now"
              color="violet"
              onClick={processInbox}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface ContinuityCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  color: "emerald" | "sky" | "amber" | "violet";
  onClick: () => void;
}

function ContinuityCard({ icon, title, description, actionLabel, color, onClick }: ContinuityCardProps) {
  const colorMap = {
    emerald: "border-emerald-500/20 bg-emerald-500/[0.02] hover:border-emerald-500/40 text-emerald-400",
    sky: "border-sky-500/20 bg-sky-500/[0.02] hover:border-sky-500/40 text-sky-400",
    amber: "border-amber-500/20 bg-amber-500/[0.02] hover:border-amber-500/40 text-amber-400",
    violet: "border-violet-500/20 bg-violet-500/[0.02] hover:border-violet-500/40 text-violet-400",
  };

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-5 text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/10",
        colorMap[color]
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/5 transition-transform group-hover:scale-110">
          {icon}
        </div>
        <ChevronRight size={16} className="text-zinc-600 group-hover:translate-x-1 transition-transform" />
      </div>

      <div className="mt-4">
        <h4 className="text-[13px] font-bold uppercase tracking-widest text-zinc-300">
          {title}
        </h4>
        <p className="mt-1 text-[15px] font-medium text-zinc-500 line-clamp-1 group-hover:text-zinc-300 transition-colors">
          {description}
        </p>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
          {actionLabel}
        </span>
      </div>
    </motion.button>
  );
}

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTaskStore } from "@/stores/use-task-store";
import { useFocus, useFocusActions } from "@/stores/use-focus-store";
import { useUserName } from "@/stores/use-ui-store";
import { getGreeting, getProductivityInsight } from "@/lib/dashboard-insights";
import { THEME } from "@/lib/constants/theme";
import { Zap, Target, CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import ReflectionOverlay from "./ReflectionOverlay";

export default function DashboardHeader() {
  const tasks = useTaskStore((state) => state.tasks);
  const { dailyAnchor, anchorCompleted } = useFocus();
  const { setDailyAnchor, toggleAnchorCompleted } = useFocusActions();
  const userName = useUserName();
  
  const [isEditing, setIsEditing] = useState(false);
  const [anchorInput, setAnchorInput] = useState("");
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);

  const greeting = getGreeting();
  const insight = getProductivityInsight(tasks);
  const completedToday = tasks.filter(
    (task) =>
      task.completed &&
      task.completedAt &&
      new Date(task.completedAt).toDateString() === new Date().toDateString()
  ).length;
  const highPriorityOpen = tasks.filter((task) => !task.completed && task.priority === "high").length;
  const focusBadgeLabel =
    completedToday > 0
      ? `${completedToday} completed today`
      : highPriorityOpen > 0
        ? `${highPriorityOpen} high priority`
        : "Ready to plan";

  const handleSetAnchor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!anchorInput.trim()) return;
    setDailyAnchor(anchorInput.trim());
    setIsEditing(false);
    setAnchorInput("");
  };

  const handleToggleCompleted = () => {
    const wasCompleted = anchorCompleted;
    toggleAnchorCompleted();
    
    // If just completed, open reflection
    if (!wasCompleted) {
      setIsReflectionOpen(true);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.15),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-8 shadow-2xl shadow-black/20">
      <ReflectionOverlay 
        isOpen={isReflectionOpen} 
        onClose={() => setIsReflectionOpen(false)} 
      />
      
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-2 w-2 rounded-full bg-emerald-400" 
          />
          <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-emerald-400/80">
            Thinking space
          </span>
        </div>
        
        {dailyAnchor && (
          <button 
            type="button"
            onClick={() => setDailyAnchor(null)}
            className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors"
            aria-label="Reset daily anchor"
          >
            Reset Anchor
          </button>
        )}
      </div>
      
      <div className="grid gap-8 lg:grid-cols-[1fr_auto]">
        <div className="max-w-3xl">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={THEME.animation.fast}
            className="text-[32px] font-bold leading-[1.1] tracking-tight text-zinc-50 sm:text-[42px]"
          >
            {greeting}{userName ? `, ${userName}` : ""}. <br />
            <span className="text-zinc-500 font-medium">{insight}</span>
          </motion.h2>
          
          <div className="mt-8 flex flex-wrap gap-4">
            <InsightBadge icon={<Zap size={14} />} label={focusBadgeLabel} />
            <div className="h-4 w-px bg-white/10 my-auto" />
            <span className="text-[13px] font-medium text-zinc-500">
              Current focus: <span className="text-zinc-200">{dailyAnchor ? "Anchor set" : "Open day"}</span>
            </span>
          </div>
        </div>

        {/* Daily Anchor Section */}
        <div className="flex flex-col justify-center">
          <div className={cn(
            "relative min-w-[320px] rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl transition-all",
            anchorCompleted ? "border-emerald-500/20 bg-emerald-500/[0.02]" : "hover:border-white/20"
          )}>
            <div className="mb-4 flex items-center gap-2">
              <Target size={14} className={anchorCompleted ? "text-emerald-400" : "text-zinc-500"} />
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Daily Anchor</span>
            </div>

            <AnimatePresence mode="wait">
              {dailyAnchor ? (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-4"
                >
                  <button 
                    type="button"
                    onClick={handleToggleCompleted}
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all",
                      anchorCompleted 
                        ? "bg-emerald-500 border-emerald-500 text-zinc-950" 
                        : "border-white/20 text-zinc-500 hover:border-emerald-500/50 hover:text-emerald-500"
                    )}
                    aria-label={anchorCompleted ? "Mark daily anchor as incomplete" : "Mark daily anchor as complete"}
                  >
                    {anchorCompleted ? <CheckCircle2 size={18} strokeWidth={2.5} /> : <Circle size={18} strokeWidth={2.5} />}
                  </button>
                  <div className="flex flex-col min-w-0">
                    <p className={cn(
                      "text-[18px] font-semibold leading-tight transition-all truncate",
                      anchorCompleted ? "text-zinc-500 line-through" : "text-zinc-100"
                    )}>
                      {dailyAnchor}
                    </p>
                    <span className="text-[11px] font-medium text-zinc-600">The #1 priority for today</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  {isEditing ? (
                    <form onSubmit={handleSetAnchor} className="flex flex-col gap-3">
                      <input
                        autoFocus
                        value={anchorInput}
                        onChange={(e) => setAnchorInput(e.target.value)}
                        placeholder="What's your anchor for today?"
                        className="w-full bg-transparent text-[18px] font-semibold text-zinc-100 outline-none placeholder:text-zinc-700"
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300">Set Anchor</button>
                        <button type="button" onClick={() => setIsEditing(false)} className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-400">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="group flex flex-col gap-1 text-left"
                    >
                      <p className="text-[18px] font-semibold text-zinc-600 group-hover:text-zinc-400 transition-colors italic">Define your anchor...</p>
                      <span className="text-[11px] font-medium text-zinc-700">Set one thing that makes today a win</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-400/20">
      {icon}
      {label}
    </div>
  );
}

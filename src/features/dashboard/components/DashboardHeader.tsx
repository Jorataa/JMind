"use client";

import { motion } from "framer-motion";
import { useTaskStore } from "@/stores/use-task-store";
import { getGreeting, getProductivityInsight } from "@/lib/dashboard-insights";
import { THEME } from "@/lib/constants/theme";
import { Zap } from "lucide-react";

export default function DashboardHeader() {
  const tasks = useTaskStore((state) => state.tasks);
  
  const greeting = getGreeting();
  const insight = getProductivityInsight(tasks);

  return (
    <div className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.15),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-8 shadow-2xl shadow-black/20">
      <div className="mb-8 flex items-center gap-2">
        <motion.div 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-2 w-2 rounded-full bg-emerald-400" 
        />
        <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-emerald-400/80">
          Personal Operating System
        </span>
      </div>
      
      <div className="max-w-3xl">
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={THEME.animation.fast}
          className="text-[32px] font-bold leading-[1.1] tracking-tight text-zinc-50 sm:text-[42px]"
        >
          {greeting}, Jovan. <br />
          <span className="text-zinc-500 font-medium">{insight}</span>
        </motion.h2>
        
        <div className="mt-8 flex flex-wrap gap-4">
          <InsightBadge icon={<Zap size={14} />} label="Elite Flow" />
          <div className="h-4 w-px bg-white/10 my-auto" />
          <span className="text-[13px] font-medium text-zinc-500">
            Current Focus: <span className="text-zinc-200">Execution Phase</span>
          </span>
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

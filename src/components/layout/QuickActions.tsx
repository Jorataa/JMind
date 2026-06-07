"use client";

import { motion } from "framer-motion";
import { Plus, CheckSquare, Target, Network, Zap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { THEME } from "@/lib/constants/theme";
import { useRouter } from "next/navigation";

export default function QuickActions() {
  const [isExpanded, setIsOpen] = useState(false);
  const router = useRouter();

  const actions = [
    { icon: <CheckSquare size={18} />, label: "New Task", onClick: () => router.push("/tasks"), color: "emerald" },
    { icon: <Target size={18} />, label: "New KPI", onClick: () => router.push("/kpi"), color: "sky" },
    { icon: <Network size={18} />, label: "Mind Node", onClick: () => router.push("/mindmap"), color: "violet" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {actions.map((action, i) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ 
              opacity: isExpanded ? 1 : 0, 
              x: isExpanded ? 0 : 20,
              scale: isExpanded ? 1 : 0.8,
              pointerEvents: isExpanded ? "auto" : "none"
            }}
            transition={{ delay: i * 0.05, ...THEME.animation.spring }}
          >
            <button
              onClick={action.onClick}
              className={cn(
                "flex items-center gap-3 rounded-full border border-white/10 bg-zinc-900/90 py-2 pl-4 pr-2 text-[13px] font-bold text-zinc-100 shadow-2xl backdrop-blur-xl transition-all hover:border-white/20 active:scale-95",
                `hover:text-${action.color}-400`
              )}
            >
              {action.label}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.03] text-zinc-400">
                {action.icon}
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Main Toggle */}
      <button
        onClick={() => setIsOpen(!isExpanded)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400 text-zinc-950 shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-all active:scale-90",
          isExpanded ? "rotate-45 bg-zinc-100" : "rotate-0"
        )}
      >
        {isExpanded ? <Plus size={24} /> : <Zap size={24} fill="currentColor" />}
      </button>
    </div>
  );
}

"use client";

import { useKPIStore, useKPIActions } from "@/stores/use-kpi-store";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, Target } from "lucide-react";
import { calculateProgress } from "@/lib/calculate-progress";
import { cn } from "@/lib/cn";
import { motion } from "framer-motion";
import Link from "next/link";

export default function KPIQuickAccess() {
  const kpis = useKPIStore((state) => state.kpis);
  const { updateProgress } = useKPIActions();

  const activeKPIs = kpis.slice(0, 3);

  if (kpis.length === 0) {
    return (
      <Card className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center border-dashed border-white/10 bg-transparent hover:border-white/20 transition-all">
        <div className="h-12 w-12 rounded-full bg-white/[0.03] flex items-center justify-center text-zinc-600">
          <Target size={24} />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[14px] font-medium text-zinc-400">No goals tracked yet</p>
          <p className="text-[12px] text-zinc-600">Track the numbers that matter to you.</p>
        </div>
        <Link href="/kpi">
          <Button variant="secondary" size="sm" className="mt-2">Set Your First Goal</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-4">
        {activeKPIs.map((kpi) => {
          const progress = calculateProgress(kpi.value, kpi.target);
          const isCompleted = kpi.value >= kpi.target;

          return (
            <Card key={kpi.id} className="p-4 bg-zinc-900/40 border-white/5 group overflow-hidden">
               {/* Progress Bar Background */}
              <div 
                className="absolute inset-y-0 left-0 bg-emerald-500/[0.03] transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-0.5">{kpi.category || 'Goal'}</span>
                  <h4 className="text-[14px] font-semibold text-zinc-200 truncate">{kpi.label}</h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[16px] font-bold text-zinc-50">{kpi.value}</span>
                    <span className="text-[11px] font-medium text-zinc-500">/ {kpi.target} {kpi.unit}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end gap-1 mr-2">
                    <span className={cn(
                      "text-[12px] font-bold",
                      isCompleted ? "text-emerald-400" : "text-zinc-500"
                    )}>{progress}%</span>
                    <div className="h-1 w-16 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className={cn("h-full", isCompleted ? "bg-emerald-400" : "bg-sky-400")}
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => updateProgress(kpi.id, kpi.value + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-emerald-500 hover:border-emerald-500 hover:text-zinc-950 transition-all active:scale-90 shadow-xl"
                    aria-label={`Add one to ${kpi.label}`}
                    title="Add one"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

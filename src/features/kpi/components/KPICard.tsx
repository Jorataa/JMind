"use client";

import { useState } from "react";
import { KPI, useKPIActions } from "@/stores/use-kpi-store";
import KPIForm from "./KPIForm";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { calculateProgress } from "@/lib/calculate-progress";
import { formatDate } from "@/lib/format-date";

export default function KPICard({ kpi }: { kpi: KPI }) {
  const { removeKPI, updateProgress } = useKPIActions();
  const [isEditing, setIsEditing] = useState(false);
  const [showQuickUpdate, setShowQuickUpdate] = useState(false);
  const [quickValue, setQuickValue] = useState(kpi.value.toString());

  const percentage = calculateProgress(kpi.value, kpi.target);
  const isCompleted = kpi.value >= kpi.target;

  const handleQuickUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(quickValue);
    if (!isNaN(val) && val >= 0) {
      updateProgress(kpi.id, val);
      setShowQuickUpdate(false);
    }
  };

  return (
    <Card className="group gap-5">
      {/* Top Section */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          {kpi.category && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">
              {kpi.category}
            </span>
          )}
          <h4 className="text-[15px] font-semibold text-zinc-100 leading-tight">
            {kpi.label}
          </h4>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsEditing(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>
          <Button variant="danger" size="sm" className="h-7 w-7 p-0" onClick={() => removeKPI(kpi.id)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>
        </div>
      </div>

      {/* Progress Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-[20px] font-bold text-zinc-50">{kpi.value}</span>
            <span className="text-[12px] font-medium text-zinc-500">
              / {kpi.target} {kpi.unit}
            </span>
          </div>
          <span className={`text-[13px] font-bold ${isCompleted ? "text-emerald-400" : "text-zinc-400"}`}>
            {percentage}%
          </span>
        </div>
        <ProgressBar progress={percentage} variant={isCompleted ? "emerald" : "sky"} />
      </div>

      {/* Footer / Quick Update */}
      <div className="flex items-center justify-between border-t border-white/5 pt-4">
        <span className="text-[11px] text-zinc-600">
          Updated {formatDate(kpi.updatedAt)}
        </span>
        
        {showQuickUpdate ? (
          <form onSubmit={handleQuickUpdate} className="flex items-center gap-2">
            <input
              autoFocus
              type="number"
              step="any"
              value={quickValue}
              onChange={(e) => setQuickValue(e.target.value)}
              className="h-7 w-16 rounded border border-white/10 bg-zinc-950 px-2 text-[12px] text-zinc-200 outline-none focus:border-emerald-400/50"
            />
            <Button type="submit" size="sm" className="h-7 px-2 text-[11px]">
              Set
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => setShowQuickUpdate(false)}>
              Cancel
            </Button>
          </form>
        ) : (
          <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent hover:text-emerald-400" onClick={() => {
            setQuickValue(kpi.value.toString());
            setShowQuickUpdate(true);
          }}>
            Quick Update
          </Button>
        )}
      </div>

      {isEditing && <KPIForm kpi={kpi} onClose={() => setIsEditing(false)} />}
    </Card>
  );
}

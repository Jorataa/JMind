"use client";

import { useState } from "react";
import { KPI, useKPIActions } from "@/stores/use-kpi-store";
import KPIForm from "./KPIForm";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { calculateProgress } from "@/lib/calculate-progress";
import { formatDate } from "@/lib/format-date";
import { Pencil, Trash2 } from "lucide-react";
import { Area, AreaChart as ReAreaChart, ResponsiveContainer } from "recharts";
import { THEME } from "@/lib/constants/theme";

export default function KPICard({ kpi }: { kpi: KPI }) {
  const { removeKPI, updateProgress } = useKPIActions();
  const [isEditing, setIsEditing] = useState(false);
  const [showQuickUpdate, setShowQuickUpdate] = useState(false);
  const [quickValue, setQuickValue] = useState(kpi.value.toString());

  const percentage = calculateProgress(kpi.value, kpi.target);
  const isCompleted = kpi.value >= kpi.target;
  const sparkColor = isCompleted ? THEME.colors.emerald.primary : THEME.colors.sky.primary;

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
        <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setIsEditing(true)}
            aria-label={`Edit ${kpi.label}`}
            title="Edit Goal"
          >
            <Pencil size={14} />
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => removeKPI(kpi.id)}
            aria-label={`Delete ${kpi.label}`}
            title="Delete Goal"
          >
            <Trash2 size={14} />
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

      {/* Trend — value over time. Only earns its space once there's a trend to show. */}
      {kpi.history.length >= 2 && (
        <div className="h-12 w-full" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <ReAreaChart data={kpi.history.map((h) => ({ value: h.value }))} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`spark-${kpi.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={sparkColor}
                strokeWidth={2}
                fill={`url(#spark-${kpi.id})`}
                isAnimationActive={false}
                dot={false}
              />
            </ReAreaChart>
          </ResponsiveContainer>
        </div>
      )}

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
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => setShowQuickUpdate(false)}>
              Cancel
            </Button>
          </form>
        ) : (
          <Button type="button" variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent hover:text-emerald-400" onClick={() => {
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

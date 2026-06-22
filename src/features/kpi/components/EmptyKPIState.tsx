"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function EmptyKPIState({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polyline points="2,18 8,10 12,13 19,5 22,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="19" cy="5" r="2" fill="currentColor" />
        </svg>
      }
      title="Measure what matters"
      description="A metric is one number you want to move over time."
      action={<Button onClick={onAdd}>Track your first metric</Button>}
      footer={
        <div className="flex flex-col items-center gap-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            For example
          </span>
          <div className="w-[220px] rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Reading
            </span>
            <p className="mt-0.5 text-[14px] font-semibold text-zinc-200">Pages written</p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-[16px] font-bold text-zinc-50">12</span>
              <span className="text-[11px] text-zinc-500">/ 30 pages</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div className="h-full w-[40%] rounded-full bg-emerald-400" />
            </div>
          </div>
        </div>
      }
    />
  );
}

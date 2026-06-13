"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";

interface TaskHeaderProps {
  completedCount: number;
  totalCount: number;
  progress: number;
}

export default function TaskHeader({ completedCount, totalCount, progress }: TaskHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between bg-white/[0.02]">
      <div className="flex flex-col gap-1">
        <h3 className="text-[16px] font-bold text-zinc-50">Active Execution</h3>
        <p className="text-[12px] text-zinc-500 font-medium uppercase tracking-widest">
          {completedCount} / {totalCount} Completed
        </p>
      </div>
      <div className="flex min-w-48 flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-tighter">
          <span>Overall Progress</span>
          <span className="text-emerald-400">{progress}%</span>
        </div>
        <ProgressBar progress={progress} variant="emerald" className="h-1.5" />
      </div>
    </div>
  );
}

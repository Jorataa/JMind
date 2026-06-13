"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

const EXAMPLES = ["Runs this week", "Hours studied", "Pages written", "Daily reading"];

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
      description="A KPI is one number you want to move over time. Pick something tied to a real goal — not everything, just what counts."
      action={<Button onClick={onAdd}>Add your first KPI</Button>}
      footer={
        <div className="flex flex-col items-center gap-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            For example
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((ex) => (
              <span
                key={ex}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[12px] text-zinc-400"
              >
                {ex}
              </span>
            ))}
          </div>
        </div>
      }
    />
  );
}

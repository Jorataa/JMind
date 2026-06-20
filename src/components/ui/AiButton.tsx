"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

// A small floating launcher for the AI chat. Lives in a corner of the canvas;
// clicking it opens the AiChat panel. Kept as its own reusable component so it
// can be dropped onto any screen later.
export default function AiButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open Jorata AI"
      className={cn(
        "group flex h-11 items-center gap-2 rounded-full border border-emerald-500/30",
        "bg-zinc-900/80 px-4 text-[13px] font-semibold text-emerald-300 shadow-xl backdrop-blur-md",
        "transition-all hover:border-emerald-500/50 hover:bg-zinc-900 active:scale-[0.97]",
        className
      )}
    >
      <Sparkles size={15} className="transition-transform group-hover:scale-110" />
      Ask AI
    </button>
  );
}

"use client";

import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { useUIActions } from "@/stores/use-ui-store";

/**
 * One-press capture from anywhere (same as Ctrl+J). A single honest action
 * beats an expandable menu of navigation links dressed up as "create" buttons.
 */
export default function QuickActions() {
  const pathname = usePathname();
  const { setQuickCaptureOpen } = useUIActions();

  // The canvas keeps its own corner real estate (minimap, controls).
  if (pathname.startsWith("/mindmap")) return null;

  return (
    <button
      type="button"
      onClick={() => setQuickCaptureOpen(true)}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400 text-zinc-950 shadow-[0_0_20px_rgba(52,211,153,0.35)] transition-transform hover:scale-105 active:scale-95"
      title="Quick capture (Ctrl+J)"
      aria-label="Quick capture a thought"
    >
      <Plus size={24} strokeWidth={2.5} />
    </button>
  );
}

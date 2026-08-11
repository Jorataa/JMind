"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useDailyWisdom } from "@/features/wisdom/hooks/useDailyWisdom";
import WisdomCard from "@/features/wisdom/components/WisdomCard";
import { cn } from "@/lib/cn";

/**
 * Daily Motivation — Environment Epigraph
 *
 * Appears automatically on initial dashboard load without requiring any
 * interaction, panel expansion, or dismissal. Restrained, quiet editorial styling
 * on a warm cream surface with dark green accents.
 */
export default function WisdomStrip({ className }: { className?: string }) {
  const { wisdom, today } = useDailyWisdom();
  const [sanctuaryOpen, setSanctuaryOpen] = useState(false);

  // Esc key closes the sanctuary modal if opened
  useEffect(() => {
    if (!sanctuaryOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSanctuaryOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sanctuaryOpen]);

  return (
    <>
      <section
        aria-label="Daily Motivation"
        className={cn(
          "relative overflow-hidden rounded-card border border-line-soft bg-[#FAF7F0] px-6 py-5 shadow-sm transition-all hover:border-line-strong",
          className
        )}
      >
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-baseline sm:justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="shrink-0 text-green-800" />
            <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.2em] text-green-800">
              Daily Motivation · {wisdom.category || "Mindset"}
            </span>
          </div>
          <span className="font-mono text-[11px] text-ink-500">{today}</span>
        </div>

        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
          <blockquote className="max-w-[90%] font-serif text-[18px] leading-relaxed italic text-ink-900 md:text-[20px]">
            “{wisdom.quote}”
          </blockquote>

          <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
            {wisdom.author && (
              <span className="font-sans text-[13px] font-medium text-ink-600">
                — {wisdom.author}
              </span>
            )}
            <button
              type="button"
              onClick={() => setSanctuaryOpen(true)}
              className="text-[12px] font-medium text-green-800 transition-colors hover:underline hover:text-green-900"
              title="Open full sanctuary view"
            >
              Reflect →
            </button>
          </div>
        </div>
      </section>

      {/* Full Daily Sanctuary view modal (optional deep reflection) */}
      {sanctuaryOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(27,41,31,0.4)] p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Daily Sanctuary"
          onClick={() => setSanctuaryOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-card shadow-float-3"
            onClick={(e) => e.stopPropagation()}
          >
            <WisdomCard />
          </div>
        </div>
      )}
    </>
  );
}

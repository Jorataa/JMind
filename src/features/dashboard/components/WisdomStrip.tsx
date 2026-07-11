"use client";

import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { useDailyWisdom } from "@/features/wisdom/hooks/useDailyWisdom";
import WisdomCard from "@/features/wisdom/components/WisdomCard";
import { useUIStore } from "@/stores/use-ui-store";
import { cn } from "@/lib/cn";

const DISMISS_KEY = "jmind:wisdom-strip-dismissed";

/**
 * Daily Wisdom as a quiet strip above the bento (design handoff §7):
 * one serif-italic line on straw, dismissible for the day. Clicking it opens
 * the full Daily Sanctuary experience (scenes, reflection, favorites).
 */
export default function WisdomStrip({ className }: { className?: string }) {
  const enabled = useUIStore((state) => state.wisdomStripEnabled);
  const { wisdom, dateKey } = useDailyWisdom();
  const [dismissed, setDismissed] = useState(true); // assume dismissed until read
  const [sanctuaryOpen, setSanctuaryOpen] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(localStorage.getItem(DISMISS_KEY) === dateKey);
    } catch {
      setDismissed(false);
    }
  }, [dateKey]);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, dateKey);
    } catch {
      /* private mode */
    }
  };

  // Esc closes the expanded sanctuary.
  useEffect(() => {
    if (!sanctuaryOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSanctuaryOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sanctuaryOpen]);

  if (!enabled || dismissed) return null;

  return (
    <>
      <div
        className={cn(
          "flex min-h-[56px] items-center gap-3 rounded-card bg-straw px-5 py-2.5",
          className
        )}
      >
        <button
          type="button"
          onClick={() => setSanctuaryOpen(true)}
          className="group flex min-w-0 flex-1 items-baseline gap-2 text-left"
          title="Open the Daily Sanctuary"
        >
          <p className="min-w-0 flex-1 truncate font-serif text-[15px] italic leading-snug text-straw-ink group-hover:underline">
            “{wisdom.quote}”
          </p>
          {wisdom.author && (
            <span className="hidden shrink-0 text-[12px] text-straw-text sm:block">
              — {wisdom.author}
            </span>
          )}
          <Sparkles size={13} className="hidden shrink-0 text-straw-text sm:block" />
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-full p-1 text-straw-text transition-colors hover:bg-[rgba(107,82,34,0.1)]"
          aria-label="Dismiss today's wisdom"
        >
          <X size={14} />
        </button>
      </div>

      {/* Full Daily Sanctuary, summoned from the strip */}
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

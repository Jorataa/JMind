"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFocus, useFocusActions } from "@/stores/use-focus-store";
import { useTaskStore } from "@/stores/use-task-store";
import { X } from "lucide-react";
import { ContourRings } from "@/components/ui/ContourArt";

/**
 * Focus Session (design handoff §7): full-screen evergreen — the one thing,
 * a quiet timer, contour rings breathing in the corner. Capture and the
 * palette stay reachable mid-session.
 */
export default function FocusHUD() {
  const { dailyAnchor, deepWorkMode, deepWorkStartedAt, activeTaskId } = useFocus();
  const { setDeepWorkMode } = useFocusActions();
  const tasks = useTaskStore((state) => state.tasks);

  const activeTask = activeTaskId ? tasks.find(t => t.id === activeTaskId) : null;

  // The interval only advances `now`; elapsed time is derived at render so no
  // state needs syncing when the session starts or resumes.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deepWorkMode || !deepWorkStartedAt) return;

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [deepWorkMode, deepWorkStartedAt]);

  const elapsedSeconds = getElapsedSeconds(deepWorkStartedAt, now);

  const focusTitle = activeTask?.title ?? dailyAnchor ?? "Choose one thing to focus on";
  const focusStatus = useMemo(() => {
    if (activeTask) return "task focus";
    if (dailyAnchor) return "today's focus";
    return "open focus";
  }, [activeTask, dailyAnchor]);

  return (
    <AnimatePresence>
      {deepWorkMode && (
        // Sits above the workspace (rail z-90) but below the command
        // palette (z-110) and quick capture (z-130), so both stay usable
        // mid-session.
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[105] flex flex-col items-center justify-between overflow-hidden bg-evergreen-950 p-8 md:p-12"
          role="dialog"
          aria-label="Focus session"
        >
          <ContourRings
            variant="dark"
            size={520}
            className="absolute -bottom-32 -left-40 opacity-60"
          />
          <ContourRings
            variant="dark"
            size={300}
            className="absolute -right-24 -top-16 opacity-40"
          />

          {/* Top bar */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative z-10 flex w-full max-w-4xl items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <span className="ai-pulse h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
              <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-rail-faint">
                Focus session
              </span>
            </div>

            <button
              type="button"
              onClick={() => setDeepWorkMode(false)}
              className="flex h-9 items-center gap-1.5 rounded-full border border-[rgba(233,237,224,0.2)] px-4 text-[12.5px] text-rail-text transition-colors hover:border-[rgba(233,237,224,0.4)] hover:text-rail-bright"
            >
              <X size={13} />
              End session
            </button>
          </motion.div>

          {/* Center */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="relative z-10 flex flex-col items-center gap-7 text-center"
          >
            <span className="text-[11px] font-medium uppercase tracking-[0.4em] text-rail-faint">
              One thing
            </span>
            <h2 className="max-w-[22ch] font-serif text-[36px] leading-[1.15] text-[#E9EDE0] md:text-[52px]">
              {focusTitle}
            </h2>

            <div className="mt-2 flex items-center gap-8">
              <span className="font-mono text-[20px] tabular-nums text-rail-muted">
                {formatElapsed(elapsedSeconds)}
              </span>
              <span aria-hidden className="h-6 w-px bg-[rgba(233,237,224,0.15)]" />
              <span className="font-serif text-[16px] italic text-emerald-300">
                {focusStatus}
              </span>
            </div>
          </motion.div>

          {/* Bottom shortcuts */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative z-10 flex items-center gap-10"
          >
            <Shortcut hint="Capture" keys={["Ctrl", "J"]} />
            <Shortcut hint="Palette" keys={["Ctrl", "K"]} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function getElapsedSeconds(startedAt: string | null, now: number) {
  if (!startedAt) return 0;

  const started = new Date(startedAt).getTime();
  if (Number.isNaN(started)) return 0;

  return Math.max(0, Math.floor((now - started) / 1000));
}

function formatElapsed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((part) => part.toString().padStart(2, "0"))
    .join(":");
}

function Shortcut({ hint, keys }: { hint: string; keys: string[] }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[11px] text-rail-faint">{hint}</span>
      <div className="flex gap-1">
        {keys.map(k => (
          <kbd
            key={k}
            className="flex h-6 min-w-[24px] items-center justify-center rounded-kbd border border-[rgba(233,237,224,0.15)] bg-[rgba(233,237,224,0.06)] px-1.5 font-mono text-[10px] text-rail-muted"
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFocus, useFocusActions } from "@/stores/use-focus-store";
import { useTaskStore } from "@/stores/use-task-store";
import { Zap, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

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

  const focusTitle = activeTask?.title ?? dailyAnchor ?? "Choose one focused outcome";
  const focusStatus = useMemo(() => {
    if (activeTask) return "Task Focus";
    if (dailyAnchor) return "Daily Anchor";
    return "Open Focus";
  }, [activeTask, dailyAnchor]);

  return (
    <AnimatePresence>
      {deepWorkMode && (
        // Sits above the workspace (sidebar z-90) but below the command
        // palette (z-110) and quick capture (z-130), so both stay usable
        // mid-session.
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[105] flex flex-col items-center justify-between bg-zinc-950/95 p-12 backdrop-blur-xl"
        >
          {/* Top Bar */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex w-full max-w-4xl items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950">
                <Zap size={20} fill="currentColor" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500/80">Deep Work</span>
                <span className="text-[14px] font-semibold text-zinc-100">Session Active</span>
              </div>
            </div>

            <Button
              variant="ghost"
              className="text-zinc-500 hover:bg-rose-400/10 hover:text-rose-400"
              onClick={() => setDeepWorkMode(false)}
            >
              <X size={18} className="mr-2" />
              End Session
            </Button>
          </motion.div>

          {/* Center Focus */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col items-center gap-6 text-center"
          >
            <div className="h-1 w-24 overflow-hidden rounded-full bg-emerald-500/20">
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="h-full w-full bg-emerald-500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-bold uppercase tracking-[0.4em] text-zinc-600">Current Focus</span>
              <h2 className="max-w-2xl text-[42px] font-bold tracking-tight text-zinc-100">
                {focusTitle}
              </h2>
            </div>

            <div className="mt-4 flex items-center gap-8">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Time Elapsed</span>
                <span className="font-mono text-[18px] text-zinc-400">{formatElapsed(elapsedSeconds)}</span>
              </div>
              <div className="h-8 w-px bg-white/5" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Status</span>
                <span className="text-[18px] font-medium text-emerald-400">{focusStatus}</span>
              </div>
            </div>
          </motion.div>

          {/* Bottom Shortcuts */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-12"
          >
            <Shortcut hint="Capture Thought" keys={["CTRL", "J"]} />
            <Shortcut hint="Command Palette" keys={["CTRL", "K"]} />
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
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-medium text-zinc-600">{hint}</span>
      <div className="flex gap-1.5">
        {keys.map(k => (
          <span key={k} className="flex h-6 min-w-[24px] items-center justify-center rounded border border-white/10 bg-white/[0.03] px-1.5 text-[10px] font-bold text-zinc-500">{k}</span>
        ))}
      </div>
    </div>
  );
}

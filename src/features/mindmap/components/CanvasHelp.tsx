"use client";

import { useState } from "react";
import { Panel } from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * One quiet "?" button instead of two always-on overlay cards (shortcuts +
 * legend). The canvas stays calm; the reference is a click away.
 */
export default function CanvasHelp() {
  const [open, setOpen] = useState(false);

  return (
    <Panel position="top-right" className="z-10 mr-4 mt-4">
      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border border-white/5 bg-zinc-900/60 text-zinc-500 shadow-xl backdrop-blur-xl transition-colors hover:text-zinc-200",
            open && "border-white/20 text-zinc-200"
          )}
          title="Shortcuts & legend"
          aria-label="Toggle shortcuts and legend"
          aria-expanded={open}
        >
          {open ? <X size={14} /> : <Keyboard size={14} />}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="flex w-[220px] flex-col gap-2 rounded-2xl border border-white/5 bg-zinc-900/80 p-4 shadow-2xl backdrop-blur-xl"
            >
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Shortcuts
              </p>
              <Hint keyName="2× Click" action="New idea" />
              <Hint keyName="Tab" action="New child" />
              <Hint keyName="S" action="Sticky note" />
              <Hint keyName="R-Click" action="Quick actions" />
              <Hint keyName="Enter" action="Rename node" />
              <Hint keyName="Del" action="Delete node" />
              <Hint keyName="Ctrl + Z" action="Undo" />
              <Hint keyName="Ctrl + ⇧ + Z" action="Redo" />
              <Hint keyName="I" action="Node details" />
              <Hint keyName="F" action="Fit view" />
              <Hint keyName="Shift + T" action="Tidy map" />

              <div className="my-2 h-px bg-white/5" />

              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Categories
              </p>
              <div className="grid grid-cols-2 gap-2">
                <LegendItem color="bg-indigo-500" label="Goal" />
                <LegendItem color="bg-emerald-500" label="Action" />
                <LegendItem color="bg-violet-500" label="Idea" />
                <LegendItem color="bg-rose-500" label="Risk" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Panel>
  );
}

function Hint({ keyName, action }: { keyName: string; action: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-[11px] font-medium text-zinc-400">{action}</span>
      <kbd className="min-w-[28px] rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-center text-[10px] font-bold text-zinc-300">
        {keyName}
      </kbd>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-1.5 w-1.5 rounded-full", color)} />
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</span>
    </div>
  );
}

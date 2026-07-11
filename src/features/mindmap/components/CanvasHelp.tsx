"use client";

import { useState } from "react";
import { Panel } from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * One quiet "?" button instead of two always-on overlay cards (shortcuts +
 * legend). The canvas stays calm; the reference is a click away. Sits above
 * the zoom pill in the bottom-right stack.
 */
export default function CanvasHelp() {
  const [open, setOpen] = useState(false);

  return (
    <Panel position="bottom-right" className="z-10 !m-4 !mb-[132px] md:!mb-[60px]">
      <div className="flex flex-col items-end gap-2">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="flex w-[230px] flex-col gap-2 rounded-node border border-line-hair bg-card p-4 shadow-float-2"
            >
              <p className="mb-1 text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
                Shortcuts
              </p>
              <Hint keyName="2× Click" action="New idea" />
              <Hint keyName="Tab" action="New child" />
              <Hint keyName="V · N · C" action="Tools" />
              <Hint keyName="S" action="Sticky note" />
              <Hint keyName="J" action="Ask Jorata" />
              <Hint keyName="R-Click" action="Quick actions" />
              <Hint keyName="Enter" action="Rename node" />
              <Hint keyName="Del" action="Delete node" />
              <Hint keyName="Ctrl + Z" action="Undo" />
              <Hint keyName="Space + drag" action="Pan" />
              <Hint keyName="F" action="Fit view" />
              <Hint keyName="Shift + T" action="Tidy map" />

              <div className="my-2 h-px bg-line-soft" />

              <p className="mb-1 text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
                Categories
              </p>
              <div className="grid grid-cols-2 gap-2">
                <LegendItem color="bg-green-800" label="Goal" />
                <LegendItem color="bg-emerald-500" label="Action" />
                <LegendItem color="bg-ochre-500" label="Idea" />
                <LegendItem color="bg-clay-500" label="Risk" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border border-line-hair bg-card text-ink-500 shadow-float-1 transition-colors hover:text-ink-900",
            open && "border-line-strong text-ink-900"
          )}
          title="Shortcuts & legend"
          aria-label="Toggle shortcuts and legend"
          aria-expanded={open}
        >
          {open ? <X size={14} /> : <Keyboard size={14} />}
        </button>
      </div>
    </Panel>
  );
}

function Hint({ keyName, action }: { keyName: string; action: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-[11.5px] text-ink-600">{action}</span>
      <kbd className="min-w-[28px] rounded-kbd border border-line-hair bg-sunken px-1.5 py-0.5 text-center font-mono text-[10px] text-ink-600">
        {keyName}
      </kbd>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-[7px] w-[7px] rounded-full", color)} />
      <span className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-500">{label}</span>
    </div>
  );
}

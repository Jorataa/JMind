"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Lightbulb, Maximize, StickyNote } from "lucide-react";

interface PaneContextMenuProps {
  x: number;
  y: number;
  onAddIdea: () => void;
  onAddSticky: () => void;
  onFitView: () => void;
  onClose: () => void;
}

/**
 * Right-click on empty canvas → create exactly where you clicked. This is the
 * discoverable twin of the invisible affordances (double-click, S key).
 */
export default function PaneContextMenu({ x, y, onAddIdea, onAddSticky, onFitView, onClose }: PaneContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const safeX = typeof window === "undefined" ? x : Math.min(x, window.innerWidth - 220);
  const safeY = typeof window === "undefined" ? y : Math.min(y, window.innerHeight - 180);

  // Click-away dismissal — pane clicks already close via the canvas, this
  // covers clicks on nodes, toolbars and everything else.
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [onClose]);

  const handle = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{ left: Math.max(12, safeX), top: Math.max(12, safeY) }}
      className="fixed z-[100] min-w-[200px] overflow-hidden rounded-node border border-line-hair bg-card p-1.5 shadow-float-2"
    >
      <div className="flex flex-col gap-0.5">
        <MenuItem
          icon={<Lightbulb size={14} className="text-emerald-600" />}
          label="New idea here"
          shortcut="2× Click"
          onClick={() => handle(onAddIdea)}
        />
        <MenuItem
          icon={<StickyNote size={14} className="text-ochre-500" />}
          label="Sticky note here"
          shortcut="S"
          onClick={() => handle(onAddSticky)}
        />
        <div className="my-1 h-px bg-line-soft" />
        <MenuItem
          icon={<Maximize size={14} />}
          label="Fit view"
          shortcut="F"
          onClick={() => handle(onFitView)}
        />
      </div>
    </motion.div>
  );
}

function MenuItem({ icon, label, shortcut, onClick }: { icon: React.ReactNode; label: string; shortcut?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[9px] px-3 py-2 text-[13.5px] font-medium text-ink-700 transition-colors hover:bg-sunken"
    >
      {icon}
      {label}
      {shortcut && (
        <kbd className="ml-auto rounded-kbd border border-line-hair bg-sunken px-1.5 py-0.5 font-mono text-[10px] text-ink-500">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}

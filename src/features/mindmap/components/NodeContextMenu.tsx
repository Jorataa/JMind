"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Trash2, Copy, CheckCircle2, PanelRight, PenLine, Wand2 } from "lucide-react";
import { useMindMapActions, useMindMapStore } from "@/stores/use-mindmap-store";
import { expandNodeWithAi } from "@/features/ai/useAiGenerate";
import { cn } from "@/lib/cn";

interface NodeContextMenuProps {
  id: string;
  x: number;
  y: number;
  onClose: () => void;
}

export default function NodeContextMenu({ id, x, y, onClose }: NodeContextMenuProps) {
  const { removeNode, duplicateNode, updateNodeData, convertNodeToTask, beginEditing, openInspector } = useMindMapActions();
  const node = useMindMapStore((state) => state.nodes.find((n) => n.id === id));
  const menuRef = useRef<HTMLDivElement>(null);
  const isLinked = (node?.data.linkedTaskIds?.length ?? 0) > 0;
  const isRoot = node?.data.isRoot;
  const isSticky = node?.type === "sticky";
  const activeColor = (node?.data.color as string) || "yellow";
  const safeX = typeof window === "undefined" ? x : Math.min(x, window.innerWidth - 220);
  const safeY = typeof window === "undefined" ? y : Math.min(y, window.innerHeight - 320);

  // Click-away dismissal — pane clicks already close via the canvas, this
  // covers clicks on nodes, toolbars and everything else.
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [onClose]);

  const handleAction = (action: () => void) => {
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
        <ContextItem
          icon={<PenLine size={14} />}
          label="Rename"
          shortcut="Enter"
          onClick={() => handleAction(() => beginEditing(id))}
        />
        <ContextItem
          icon={<PanelRight size={14} />}
          label="Open Details"
          shortcut="I"
          onClick={() => handleAction(() => openInspector(id))}
        />
        {!isSticky && (
          <ContextItem
            icon={<Wand2 size={14} className="text-emerald-600" />}
            label="Expand with AI"
            onClick={() => handleAction(() => expandNodeWithAi(id))}
          />
        )}
        <div className="h-px bg-line-soft my-1" />

        {!isLinked && !isRoot && (
          <>
            <ContextItem
              icon={<CheckCircle2 size={14} className="text-emerald-600" />}
              label="Convert to Task"
              onClick={() => handleAction(() => convertNodeToTask(id))}
            />
            <div className="h-px bg-line-soft my-1" />
          </>
        )}

        <ContextItem
          icon={<Copy size={14} />}
          label="Duplicate Node"
          onClick={() => handleAction(() => duplicateNode(id))}
        />
        <div className="h-px bg-line-soft my-1" />
        
        {isSticky ? (
          <>
            <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-500">Paper Color</p>
            <div className="grid grid-cols-4 gap-1 px-1.5 pb-1.5">
              {([
                ["yellow", "bg-[#F3E9C8]"],
                ["blue", "bg-[#E2E9EE]"],
                ["green", "bg-[#E9EDE0]"],
                ["pink", "bg-[#F2E4DC]"],
              ] as const).map(([color, bg]) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleAction(() => updateNodeData(id, { color }))}
                  className={cn(
                    "h-6 w-full rounded-full border transition-all hover:scale-110 active:scale-95",
                    bg,
                    activeColor === color
                      ? "border-green-800 ring-1 ring-green-800/40"
                      : "border-line-strong"
                  )}
                  aria-label={`Set sticky color to ${color}`}
                  title={color.charAt(0).toUpperCase() + color.slice(1)}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-500">Change Category</p>
            <div className="grid grid-cols-5 gap-1 px-1.5 pb-1.5">
              <CategoryBtn label="Default" color="zinc" onClick={() => handleAction(() => updateNodeData(id, { category: "default" }))} />
              <CategoryBtn label="Action" color="emerald" onClick={() => handleAction(() => updateNodeData(id, { category: "task" }))} />
              <CategoryBtn label="Goal" color="indigo" onClick={() => handleAction(() => updateNodeData(id, { category: "goal" }))} />
              <CategoryBtn label="Idea" color="violet" onClick={() => handleAction(() => updateNodeData(id, { category: "idea" }))} />
              <CategoryBtn label="Risk" color="rose" onClick={() => handleAction(() => updateNodeData(id, { category: "warning" }))} />
            </div>
          </>
        )}

        {!isRoot && (
          <>
            <div className="h-px bg-line-soft my-1" />
            <ContextItem
              icon={<Trash2 size={14} />}
              label="Delete Node"
              shortcut="Del"
              variant="danger"
              onClick={() => handleAction(() => removeNode(id))}
            />
          </>
        )}
      </div>
    </motion.div>
  );
}

function ContextItem({ icon, label, shortcut, onClick, variant = "default" }: { icon: React.ReactNode; label: string; shortcut?: string; onClick: () => void; variant?: "default" | "danger" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-[9px] px-3 py-2 text-[13.5px] font-medium transition-colors",
        variant === "danger" ? "text-clay-text hover:bg-clay-bg" : "text-ink-700 hover:bg-sunken"
      )}
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

function CategoryBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  const bg = {
    zinc: "bg-sunken",
    emerald: "bg-emerald-500",
    indigo: "bg-green-800",
    violet: "bg-ochre-500",
    rose: "bg-clay-500",
  }[color] || "bg-sunken";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-6 w-full rounded-full border border-line-strong transition-all hover:scale-110 active:scale-95",
        bg
      )}
      aria-label={`Set category to ${label}`}
      title={label}
    />
  );
}

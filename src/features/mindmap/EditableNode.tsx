"use client";

import React, { memo, useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/cn";
import { useMindMapActions, useMindMapStore, MindMapNodeData } from "@/stores/use-mindmap-store";
import { motion } from "framer-motion";
import { AlertCircle, Clock, CheckCircle2, ListTodo, Plus, Minus } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const categoryStyles: Record<string, { bg: string; text: string; glow: string }> = {
  default: { bg: "#18181b", text: "#e4e4e7", glow: "rgba(0,0,0,0.22)" },
  goal: { bg: "#1e1b4b", text: "#e0e7ff", glow: "rgba(99,102,241,0.2)" },
  task: { bg: "#064e3b", text: "#d1fae5", glow: "rgba(16,185,129,0.2)" },
  idea: { bg: "#4c1d95", text: "#f5f3ff", glow: "rgba(139,92,246,0.2)" },
  warning: { bg: "#450a0a", text: "#fef2f2", glow: "rgba(239,68,68,0.2)" },
};

// ─── EditableNode ─────────────────────────────────────────────────────────────

function EditableNode({ id, data, selected }: { id: string; data: MindMapNodeData; selected?: boolean }) {
  const { updateNodeData, updateNodeLabel, addNode, toggleNodeCollapse } = useMindMapActions();
  const isRoot = data.isRoot ?? false;
  const isLinked = data.linkedTaskIds?.length > 0;
  const category = data.category ?? "default";
  const style = categoryStyles[category] || categoryStyles.default;

  // Direct children — drives the collapse toggle. Primitive selector, so the
  // node only re-renders when its own child count actually changes.
  const childCount = useMindMapStore((s) => s.edges.filter((e) => e.source === id).length);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [draft, setDraft] = useState<string>(data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  // `isNew` is the store's "please start editing" signal — set on creation and
  // by beginEditing (Enter key / context menu rename). Local state adjusts
  // during render (guarded); the effect only syncs the flag back to the store.
  if (data.isNew && !isEditing) {
    setDraft(data.label);
    setIsEditing(true);
  }

  useEffect(() => {
    if (data.isNew) {
      updateNodeData(id, { isNew: false });
    }
  }, [data.isNew, id, updateNodeData]);

  useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [isEditing]);

  const commitLabel = useCallback(() => {
    const trimmed = draft.trim();
    const finalLabel = trimmed.length > 0 ? trimmed : data.label;

    if (finalLabel !== data.label) {
      updateNodeLabel(id, finalLabel);
    }

    setDraft(finalLabel);
    setIsEditing(false);
  }, [draft, id, updateNodeLabel, data.label]);

  const cancelEdit = useCallback(() => {
    setDraft(data.label);
    setIsEditing(false);
  }, [data.label]);

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitLabel();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    } else if (e.key === "Tab") {
      e.preventDefault();
      commitLabel();
      addNode("New Idea", id);
    }
    // Keep canvas-level shortcuts from firing while typing.
    e.stopPropagation();
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(data.label);
    setIsEditing(true);
  };

  // Touch parity for double-click-to-edit: two quick taps open the editor.
  // Single taps still bubble to React Flow for selection.
  const lastTapRef = useRef(0);
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const now = Date.now();
      if (now - lastTapRef.current < 280) {
        e.stopPropagation();
        setDraft(data.label);
        setIsEditing(true);
      }
      lastTapRef.current = now;
    },
    [data.label]
  );

  // Connection points: visible on the selected node (discoverable through a
  // normal click) and on hover, faded otherwise so the canvas stays calm.
  const handleClass = cn(
    "!w-2.5 !h-2.5 !bg-zinc-500 !border-zinc-300 transition-opacity group-hover:opacity-100",
    selected ? "opacity-100" : "opacity-0"
  );

  // Node UI
  return (
    <motion.div
      initial={false}
      whileHover={{ y: -1, boxShadow: `0 8px 20px ${style.glow}` }}
      animate={{
        scale: selected ? 1.02 : 1,
        boxShadow: selected
          ? `0 0 0 2px ${isRoot ? "rgba(52,211,153,0.3)" : "rgba(99,102,241,0.3)"}, 0 12px 30px ${style.glow}`
          : `0 2px 8px ${style.glow}`,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "relative rounded-xl border px-5 py-3 min-w-[140px] max-w-[280px] group outline-none",
        "transition-all duration-200",
        isEditing ? "cursor-text" : "cursor-grab active:cursor-grabbing",
        isRoot ? "bg-emerald-500 text-zinc-950 font-bold border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] min-w-[160px] py-4 text-lg" : ""
      )}
      style={!isRoot ? {
        backgroundColor: style.bg,
        color: style.text,
        borderColor: isEditing
          ? "rgba(99,102,241,0.4)"
          : selected
            ? "rgba(255,255,255,0.25)"
            : "rgba(255,255,255,0.08)",
      } : {}}
      onDoubleClick={onDoubleClick}
      onTouchEnd={onTouchEnd}
    >
      <Handle type="target" position={Position.Left} className={handleClass} />
      <Handle type="source" position={Position.Right} className={handleClass} />

      {/* Collapse / expand this branch. Collapsed shows the hidden-child count
          and stays visible so a folded branch is findable; expanded reveals on
          hover so it stays calm. */}
      {childCount > 0 && !isEditing && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleNodeCollapse(id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className={cn(
            "nodrag nopan absolute -bottom-2.5 left-1/2 z-10 flex h-5 -translate-x-1/2 items-center justify-center gap-0.5 rounded-full border px-1.5 text-[10px] font-bold shadow-md transition-opacity",
            data.collapsed
              ? "border-white/20 bg-zinc-800 text-zinc-100 opacity-100"
              : "border-white/15 bg-zinc-900 text-zinc-400 opacity-0 group-hover:opacity-100"
          )}
          title={data.collapsed ? `Expand ${childCount} hidden` : "Collapse branch"}
          aria-label={data.collapsed ? "Expand branch" : "Collapse branch"}
        >
          {data.collapsed ? (
            <>
              <Plus size={10} strokeWidth={3} />
              {childCount}
            </>
          ) : (
            <Minus size={11} strokeWidth={3} />
          )}
        </button>
      )}

      {/* Status/Priority Indicators */}
      {!isRoot && !isEditing && (
        <div className="absolute -top-2 -right-1 flex gap-1">
          {isLinked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="rounded-full bg-indigo-500 p-0.5 text-white shadow-lg"
            >
              <ListTodo size={10} strokeWidth={3} />
            </motion.div>
          )}
          {data.priority === "high" && (
            <div className="rounded-full bg-rose-500 p-0.5 text-white shadow-lg">
              <AlertCircle size={10} strokeWidth={3} />
            </div>
          )}
          {data.status === "doing" && (
            <div className="rounded-full bg-sky-500 p-0.5 text-white shadow-lg animate-pulse">
              <Clock size={10} strokeWidth={3} />
            </div>
          )}
          {data.status === "done" && (
            <div className="rounded-full bg-emerald-500 p-0.5 text-white shadow-lg">
              <CheckCircle2 size={10} strokeWidth={3} />
            </div>
          )}
        </div>
      )}

      {isEditing ? (
        <input
          ref={inputRef}
          className="nodrag nopan w-full bg-transparent border-none outline-none text-inherit font-inherit text-[14px] cursor-text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onInputKeyDown}
          onBlur={commitLabel}
          onMouseDown={(e) => e.stopPropagation()}
          spellCheck={false}
          autoComplete="off"
        />
      ) : (
        <div className="flex flex-col gap-0.5">
          <span className="block whitespace-nowrap overflow-hidden text-ellipsis text-[14px]">
            {data.label}
          </span>
          {data.description && (
             <span className="block h-1 w-8 rounded-full bg-white/10" />
          )}
        </div>
      )}
    </motion.div>
  );
}

export default memo(EditableNode);

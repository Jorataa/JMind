"use client";

import React, { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/cn";
import { useMindMapActions, MindMapNodeData } from "@/stores/use-mindmap-store";
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const categoryStyles: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  default: { bg: "#18181b", text: "#e4e4e7", border: "rgba(255,255,255,0.10)", glow: "rgba(0,0,0,0.22)" },
  goal: { bg: "#1e1b4b", text: "#e0e7ff", border: "rgba(99,102,241,0.4)", glow: "rgba(99,102,241,0.2)" },
  task: { bg: "#064e3b", text: "#d1fae5", border: "rgba(16,185,129,0.4)", glow: "rgba(16,185,129,0.2)" },
  idea: { bg: "#4c1d95", text: "#f5f3ff", border: "rgba(139,92,246,0.4)", glow: "rgba(139,92,246,0.2)" },
  warning: { bg: "#450a0a", text: "#fef2f2", border: "rgba(239,68,68,0.4)", glow: "rgba(239,68,68,0.2)" },
};

// ─── EditableNode ─────────────────────────────────────────────────────────────

export default function EditableNode({ id, data, selected }: { id: string; data: MindMapNodeData; selected?: boolean }) {
  const { updateNodeData, updateNodeLabel, selectNode } = useMindMapActions();
  const isRoot = data.isRoot ?? false;
  const category = data.category ?? "default";
  const style = categoryStyles[category] || categoryStyles.default;

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [draft, setDraft] = useState<string>(data.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAutoFocused = useRef<boolean>(false);

  useEffect(() => {
    if (data.isNew && !hasAutoFocused.current) {
      hasAutoFocused.current = true;
      setIsEditing(true);
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

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitLabel();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(data.label);
    setIsEditing(true);
  };

  // Node UI
  return (
    <div 
      className={cn(
        "relative rounded-xl px-4 py-2.5 min-w-[140px] transition-all duration-300 border-2 group",
        selected ? "ring-2 ring-emerald-400/50 scale-105 z-10" : "ring-0",
        isRoot ? "bg-emerald-400 text-zinc-950 font-bold border-emerald-400 shadow-[0_8px_32px_rgba(52,211,153,0.3)]" : ""
      )}
      style={!isRoot ? {
        backgroundColor: style.bg,
        color: style.text,
        borderColor: isEditing ? "rgba(99,102,241,0.6)" : (selected ? "rgba(255,255,255,0.4)" : style.border),
        boxShadow: `0 10px 25px ${style.glow}`
      } : {}}
      onDoubleClick={onDoubleClick}
      onClick={() => selectNode(id)}
    >
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-zinc-800 !border-white/20" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-zinc-800 !border-white/20" />

      {/* Status/Priority Indicators */}
      {!isRoot && !isEditing && (
        <div className="absolute -top-2.5 right-2 flex gap-1">
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
          className="nodrag nopan w-full bg-transparent border-none outline-none text-inherit font-inherit cursor-text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
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
    </div>
  );
}

"use client";

import React, { memo, useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { useMindMapActions, MindMapNodeData } from "@/stores/use-mindmap-store";
import { motion } from "framer-motion";

// ─── Constants ────────────────────────────────────────────────────────────────

const stickyColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  yellow: { bg: "#fef9c3", text: "#854d0e", border: "#fde047", glow: "rgba(253,224,71,0.2)" },
  blue: { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd", glow: "rgba(147,197,253,0.2)" },
  green: { bg: "#dcfce7", text: "#166534", border: "#86efac", glow: "rgba(134,239,172,0.2)" },
  pink: { bg: "#fce7f3", text: "#9d174d", border: "#f9a8d4", glow: "rgba(249,168,212,0.2)" },
};

// ─── StickyNode ───────────────────────────────────────────────────────────────

function StickyNode({ id, data, selected }: { id: string; data: MindMapNodeData; selected?: boolean }) {
  const { updateNodeData, updateNodeLabel } = useMindMapActions();
  const colorKey = (data.color as string) || "yellow";
  const style = stickyColors[colorKey] || stickyColors.yellow;

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [draft, setDraft] = useState<string>(data.label);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (data.isNew && !isEditing) {
    setDraft(data.label);
    setIsEditing(true);
  }

  useEffect(() => {
    if (data.isNew) {
      updateNodeData(id, { isNew: false });
    }
  }, [data.isNew, id, updateNodeData]);

  // Paper never grows scrollbars: the textarea tracks its content height so
  // the note expands with the thought, in edit mode exactly like display mode.
  const autogrow = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
        autogrow();
      });
    }
  }, [isEditing, autogrow]);

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

  const onInputKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      commitLabel();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
    e.stopPropagation();
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(data.label);
    setIsEditing(true);
  };

  return (
    <motion.div
      initial={false}
      whileHover={{ y: -2, rotate: -1 }}
      animate={{
        scale: selected ? 1.05 : 1,
        rotate: selected ? -1 : 0,
        boxShadow: selected
          ? `0 15px 35px ${style.glow}`
          : `0 4px 12px rgba(0,0,0,0.1)`,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "relative w-[180px] min-h-[180px] p-6 flex flex-col items-center justify-center text-center rounded-sm",
        "transition-[border-color] duration-150 shadow-lg",
        isEditing ? "cursor-text" : "cursor-grab active:cursor-grabbing",
        "border-b-2"
      )}
      style={{
        backgroundColor: style.bg,
        color: style.text,
        borderColor: style.border,
      }}
      onDoubleClick={onDoubleClick}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          className="nodrag nopan w-full overflow-hidden bg-transparent border-none outline-none text-inherit font-medium text-[15px] cursor-text resize-none text-center leading-relaxed"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            autogrow();
          }}
          onKeyDown={onInputKeyDown}
          onBlur={commitLabel}
          onMouseDown={(e) => e.stopPropagation()}
          spellCheck={false}
          autoComplete="off"
        />
      ) : (
        // pre-wrap: Shift+Enter line breaks must survive display mode.
        <span className="block w-full whitespace-pre-wrap break-words text-[15px] font-medium leading-relaxed">
          {data.label}
        </span>
      )}
      
      {/* Visual fold at the bottom-right for "paper" feel */}
      <div 
        className="absolute bottom-0 right-0 w-4 h-4"
        style={{
            background: `linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.05) 50%)`
        }}
      />
    </motion.div>
  );
}

export default memo(StickyNode);

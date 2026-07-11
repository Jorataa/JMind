"use client";

import React, { memo, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { useMindMapActions, MindMapNodeData } from "@/stores/use-mindmap-store";
import { motion } from "framer-motion";

/**
 * Sticky note (design handoff §6.6): straw paper, serif italic voice, a slight
 * deterministic tilt (±1.6°) and an uneven radius so it reads as pinned-on
 * paper, not another node. The classic color variants are preserved but
 * re-tuned to the Evergreen paper family.
 */
const stickyColors: Record<string, { bg: string; text: string; fold: string }> = {
  yellow: { bg: "#F3E9C8", text: "#4A4230", fold: "rgba(107,82,34,0.12)" },
  blue: { bg: "#E2E9EE", text: "#3D4F5C", fold: "rgba(61,79,92,0.12)" },
  green: { bg: "#E9EDE0", text: "#37503F", fold: "rgba(36,82,59,0.12)" },
  pink: { bg: "#F2E4DC", text: "#7E3B2A", fold: "rgba(126,59,42,0.1)" },
};

/** Stable per-note tilt: same note, same lean, every load. */
function tiltFor(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return (Math.abs(hash) % 2 === 0 ? 1 : -1) * (1.2 + (Math.abs(hash) % 5) / 10);
}

function StickyNode({ id, data, selected }: { id: string; data: MindMapNodeData; selected?: boolean }) {
  const { updateNodeData, updateNodeLabel } = useMindMapActions();
  const colorKey = (data.color as string) || "yellow";
  const style = stickyColors[colorKey] || stickyColors.yellow;
  const tilt = useMemo(() => tiltFor(id), [id]);

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
      whileHover={isEditing ? undefined : { y: -2 }}
      animate={{
        scale: selected ? 1.03 : 1,
        rotate: selected ? 0 : tilt,
        boxShadow: selected ? "var(--shadow-float-2)" : "var(--shadow-node)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn(
        "relative flex min-h-[150px] w-[190px] flex-col items-center justify-center p-6 text-center",
        isEditing ? "cursor-text" : "cursor-grab active:cursor-grabbing"
      )}
      style={{
        backgroundColor: style.bg,
        color: style.text,
        borderRadius: "4px 14px 14px 14px",
        outline: selected ? "1.5px solid var(--color-green-800)" : "none",
        outlineOffset: 2,
      }}
      onDoubleClick={onDoubleClick}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          className="nodrag nopan w-full cursor-text resize-none overflow-hidden border-none bg-transparent text-center font-serif text-[14.5px] italic leading-relaxed outline-none"
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
        <span className="block w-full whitespace-pre-wrap break-words font-serif text-[14.5px] italic leading-relaxed">
          {data.label}
        </span>
      )}

      {/* Visual fold at the bottom-right for "paper" feel */}
      <div
        className="absolute bottom-0 right-0 h-4 w-4"
        style={{
          background: `linear-gradient(135deg, transparent 50%, ${style.fold} 50%)`,
          borderBottomRightRadius: 14,
        }}
      />
    </motion.div>
  );
}

export default memo(StickyNode);

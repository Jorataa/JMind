"use client";

import React, { memo, useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Handle, Position, NodeToolbar } from "@xyflow/react";
import { cn } from "@/lib/cn";
import { useMindMapActions, useMindMapStore, MindMapNodeData } from "@/stores/use-mindmap-store";
import { motion } from "framer-motion";
import { Plus, Minus, ListTodo, Sparkles, MoreHorizontal, ArrowRight, Check, Scale, Minimize2 } from "lucide-react";
import { BRANCH_COLOR_STYLES } from "@/lib/node-colors";
import { expandNodeWithAi } from "@/features/ai/useAiGenerate";

/**
 * Map node (design handoff §6.6): paper card, radius 12, title 14/600 over a
 * quiet meta line. The central node is evergreen with a serif face. Metadata
 * renders as a priority dot (status ring around it) top-right, tag chips
 * below, and a slim branch-colored left rule on AI-generated branches.
 * Selecting a node raises the dark verb toolbar above it.
 */

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-clay-500",
  medium: "bg-ochre-500",
  low: "bg-sage-500",
};

const STATUS_RING: Record<string, string> = {
  todo: "outline outline-[1.5px] outline-offset-2 outline-ink-400/60",
  doing: "outline outline-[1.5px] outline-offset-2 outline-emerald-500 ai-pulse",
  done: "outline outline-[1.5px] outline-offset-2 outline-green-800",
};

const CATEGORY_CHIP: Record<string, { label: string; cls: string }> = {
  goal: { label: "goal", cls: "bg-sage-surface text-green-800" },
  task: { label: "task", cls: "bg-sage-surface text-green-800" },
  idea: { label: "idea", cls: "bg-straw text-straw-text" },
  warning: { label: "risk", cls: "bg-clay-bg text-clay-text" },
};

function EditableNode({ id, data, selected }: { id: string; data: MindMapNodeData; selected?: boolean }) {
  const { updateNodeData, updateNodeLabel, addNode, toggleNodeCollapse, convertNodeToTask } =
    useMindMapActions();
  const isRoot = data.isRoot ?? false;
  const isLinked = data.linkedTaskIds?.length > 0;
  const branchAccent =
    typeof data.color === "string" ? BRANCH_COLOR_STYLES[data.color]?.accent : undefined;

  // Direct children — drives the collapse toggle. Primitive selector, so the
  // node only re-renders when its own child count actually changes.
  const childCount = useMindMapStore((s) => s.edges.filter((e) => e.source === id).length);
  // Pick-mode (§5.2): null = not picking; boolean = this node's keep state.
  const pickKeep = useMindMapStore((s) =>
    s.proposalPick === null ? null : s.proposalPick.includes(id)
  );
  const togglePick = useMindMapStore((s) => s.actions.togglePick);
  const isProposed = data.proposed === true;
  // Only the central node shows the map size in its meta line.
  const nodeCount = useMindMapStore((s) => (isRoot ? s.nodes.filter((n) => n.type !== "sticky").length : 0));

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

  // The ⋯ verb opens the full context menu at the button — the menu itself is
  // owned by the canvas, so hand it the request via a DOM event.
  const openMenu = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      window.dispatchEvent(
        new CustomEvent("jorata:node-menu", {
          detail: { id, x: rect.left, y: rect.bottom + 6 },
        })
      );
    },
    [id]
  );

  // Connection points: visible on the selected node (discoverable through a
  // normal click) and on hover, faded otherwise so the canvas stays calm.
  const handleClass = cn(
    "!h-2.5 !w-2.5 !border-[1.5px] !border-sage-dash !bg-card transition-opacity group-hover:opacity-100",
    selected ? "opacity-100" : "opacity-0"
  );

  const priorityDot = PRIORITY_DOT[data.priority ?? "none"];
  const statusRing = STATUS_RING[data.status ?? "none"];
  const showMetaDot = Boolean(priorityDot || statusRing);
  const categoryChip = CATEGORY_CHIP[data.category ?? "default"];
  const meta = data.description?.trim() || data.aiDescription?.trim();
  const tags = Array.isArray(data.tags) ? data.tags.slice(0, 3) : [];

  return (
    <motion.div
      initial={false}
      whileHover={isEditing ? undefined : { y: -1 }}
      animate={{ scale: selected ? 1.01 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={cn(
        "group relative rounded-node outline-none transition-shadow duration-150",
        isEditing ? "cursor-text" : "cursor-grab active:cursor-grabbing",
        isRoot
          ? "min-w-[170px] max-w-[300px] bg-evergreen-900 px-5 py-4 text-[#E9EDE0]"
          : cn(
              "min-w-[140px] max-w-[280px] border px-4 py-3",
              isProposed ? "proposal-reveal bg-sage-surface" : "bg-card"
            )
      )}
      style={
        isRoot
          ? { boxShadow: "var(--shadow-dark-float)" }
          : isProposed
            ? {
                borderStyle: "dashed",
                borderWidth: 1.5,
                borderColor: "var(--color-sage-dash)",
                boxShadow: selected ? "var(--shadow-node-selected)" : "var(--shadow-node)",
                animationDelay: `${Math.min(data.staggerIndex ?? 0, 30) * 60}ms`,
              }
            : {
                borderColor: selected
                  ? "var(--color-green-800)"
                  : isEditing
                    ? "var(--color-emerald-500)"
                    : "#DCD7C8",
                borderLeftWidth: branchAccent ? 3 : 1,
                borderLeftColor: branchAccent ?? undefined,
                boxShadow: selected
                  ? "0 0 0 0.5px var(--color-green-800), var(--shadow-node-selected)"
                  : "var(--shadow-node)",
              }
      }
      onDoubleClick={onDoubleClick}
      onTouchEnd={onTouchEnd}
    >
      {/* Selected-node verb toolbar (§6.6) — dark pill above the node. */}
      <NodeToolbar
        isVisible={Boolean(selected) && !isEditing}
        position={Position.Top}
        offset={10}
        className="nodrag nopan"
      >
        <div
          className="flex items-center gap-0.5 rounded-full bg-evergreen-950 p-1 text-[12.5px] text-rail-text"
          style={{ boxShadow: "var(--shadow-dark-float)" }}
        >
          <button
            type="button"
            onClick={() => expandNodeWithAi(id, "expand")}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors hover:bg-[rgba(233,237,224,0.13)]"
            title="Grow this idea with AI"
          >
            <Sparkles size={11.5} className="text-emerald-300" />
            Expand
          </button>
          {!isRoot && (
            <button
              type="button"
              onClick={() => expandNodeWithAi(id, "simplify")}
              className="hidden items-center gap-1 rounded-full px-2.5 py-1 transition-colors hover:bg-[rgba(233,237,224,0.13)] sm:flex"
              title="Restate this idea more simply"
            >
              <Minimize2 size={11} />
              Simplify
            </button>
          )}
          {!isRoot && (
            <button
              type="button"
              onClick={() => expandNodeWithAi(id, "counter")}
              className="hidden items-center gap-1 rounded-full px-2.5 py-1 transition-colors hover:bg-[rgba(233,237,224,0.13)] sm:flex"
              title="Argue against this idea"
            >
              <Scale size={11} />
              Counter
            </button>
          )}
          {!isRoot && (
            <button
              type="button"
              onClick={() => convertNodeToTask(id)}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors hover:bg-[rgba(233,237,224,0.13)]"
              title="Send to Tasks"
            >
              <ArrowRight size={11.5} />
              Task
            </button>
          )}
          <button
            type="button"
            onClick={openMenu}
            className="rounded-full px-2 py-1 transition-colors hover:bg-[rgba(233,237,224,0.13)]"
            title="More…"
            aria-label="More actions"
          >
            <MoreHorizontal size={13} />
          </button>
        </div>
      </NodeToolbar>

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
            "nodrag nopan absolute -bottom-2.5 left-1/2 z-10 flex h-5 -translate-x-1/2 items-center justify-center gap-0.5 rounded-full border px-1.5 font-mono text-[10px] font-medium transition-opacity",
            data.collapsed
              ? "border-transparent bg-evergreen-900 text-[#E9EDE0] opacity-100 shadow-float-1"
              : "border-line-strong bg-card text-ink-600 opacity-0 shadow-float-1 group-hover:opacity-100"
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

      {/* Pick-mode checkbox (§5.2): keep or drop this proposal. */}
      {isProposed && pickKeep !== null && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePick(id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className={cn(
            "nodrag nopan absolute -left-2 -top-2 z-10 flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border-[1.5px] shadow-float-1 transition-colors",
            pickKeep
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-ink-400 bg-card text-transparent hover:border-green-800"
          )}
          aria-pressed={pickKeep}
          aria-label={pickKeep ? "Keep this idea" : "Drop this idea"}
          title={pickKeep ? "Keeping — click to drop" : "Dropped — click to keep"}
        >
          <Check size={11} strokeWidth={3.5} />
        </button>
      )}

      {/* Proposed material wears its provenance (§6.6). */}
      {isProposed && !isEditing && (
        <span className="mb-1 block text-[9.5px] font-medium uppercase tracking-[0.16em] text-sage-dash">
          Proposed by Jorata
        </span>
      )}

      {/* Priority dot + status ring (§6.6), top-right. */}
      {!isRoot && !isEditing && showMetaDot && (
        <span
          className={cn(
            "absolute right-2.5 top-2.5 block h-[7px] w-[7px] rounded-full",
            priorityDot ?? "bg-ink-400",
            statusRing
          )}
          title={[
            data.priority !== "none" ? `${data.priority} priority` : null,
            data.status !== "none" ? data.status : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        />
      )}

      {isEditing ? (
        <input
          ref={inputRef}
          className={cn(
            "nodrag nopan w-full cursor-text border-none bg-transparent outline-none",
            isRoot ? "font-serif text-[21px]" : "text-[14px] font-semibold text-ink-900"
          )}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onInputKeyDown}
          onBlur={commitLabel}
          onMouseDown={(e) => e.stopPropagation()}
          spellCheck={false}
          autoComplete="off"
        />
      ) : isRoot ? (
        <div className="flex flex-col gap-1">
          <span className="block font-serif text-[21px] leading-[1.25]">{data.label}</span>
          <span className="text-[11px] text-rail-muted">
            central question{nodeCount > 1 ? ` · ${nodeCount} nodes` : ""}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <span
            className={cn(
              "block overflow-hidden text-ellipsis whitespace-nowrap pr-3 text-[14px] font-semibold text-ink-900",
              data.status === "done" && "text-ink-400 line-through"
            )}
          >
            {data.label}
          </span>
          {meta && (
            <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-[12px] leading-snug text-ink-500">
              {meta}
            </span>
          )}
          {(tags.length > 0 || categoryChip || isLinked) && (
            <span className="mt-0.5 flex flex-wrap items-center gap-1">
              {categoryChip && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px text-[10.5px] font-medium",
                    categoryChip.cls
                  )}
                >
                  {categoryChip.label}
                </span>
              )}
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-sunken px-1.5 py-px text-[10.5px] text-ink-600"
                >
                  {tag}
                </span>
              ))}
              {isLinked && (
                <ListTodo size={11} className="text-green-800" aria-label="Linked to a task" />
              )}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default memo(EditableNode);

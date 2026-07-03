"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Check, Wrench } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useMindMapNodes, useMindMapActions } from "@/stores/use-mindmap-store";
import { useToast } from "@/stores/use-toast-store";
import { cn } from "@/lib/cn";
import type { FixOperation } from "@/lib/mindmap-fix";
import { useFixMap, MIN_NODES_FOR_FIX } from "./useFixMap";

const CATEGORY_LABELS: Record<string, string> = {
  goal: "Goal",
  task: "Action",
  idea: "Idea",
  warning: "Risk",
  default: "no category",
};

/** Plain-language one-liner for a proposed change, using current node labels. */
function describeOperation(op: FixOperation, labelOf: (id: string) => string): string {
  switch (op.type) {
    case "connect":
      return `Connect "${labelOf(op.nodeId)}" under "${labelOf(op.parentId ?? "")}"`;
    case "move":
      return `Move "${labelOf(op.nodeId)}" under "${labelOf(op.parentId ?? "")}"`;
    case "recategorize":
      return `Mark "${labelOf(op.nodeId)}" as ${CATEGORY_LABELS[op.category ?? "default"]}`;
    case "rename":
      return `Rename "${labelOf(op.nodeId)}" to "${op.label}"`;
    case "merge":
      return `Merge "${labelOf(op.nodeId)}" into "${labelOf(op.intoNodeId ?? "")}"`;
  }
}

// Review-first by design: the AI only ever proposes; nothing touches the map
// until the user applies, and the whole batch is one Ctrl+Z away from undone.
export default function FixMapModal({ onClose }: { onClose: () => void }) {
  const nodes = useMindMapNodes();
  const { applyMapFixes } = useMindMapActions();
  const addToast = useToast();
  const { phase, operations, error, requestReview } = useFixMap();

  const ideaNodeCount = useMemo(
    () => nodes.filter((n) => (n.type ?? "editable") === "editable").length,
    [nodes]
  );
  const tooSmall = ideaNodeCount < MIN_NODES_FOR_FIX;

  // Accepted-by-default: the user came here for suggestions; unchecking is the
  // exception. Guarded state adjustment during render (same pattern as the
  // details sidebar) — null means "not initialized for this review yet".
  const [accepted, setAcceptedState] = useState<Set<number> | null>(null);
  if (phase === "review" && accepted === null) {
    setAcceptedState(new Set(operations.map((_, i) => i)));
  }
  const acceptedSet = accepted ?? new Set<number>();
  const setAccepted = (next: Set<number>) => setAcceptedState(next);

  // The map is read once, when the modal opens.
  useEffect(() => {
    if (!tooSmall) void requestReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const labelOf = (id: string) =>
    nodes.find((n) => n.id === id)?.data.label ?? "an idea";

  const toggle = (index: number) => {
    const next = new Set(acceptedSet);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setAccepted(next);
  };

  const handleApply = () => {
    const chosen = operations.filter((_, i) => acceptedSet.has(i));
    if (chosen.length === 0) return;

    const applied = applyMapFixes(chosen);
    if (applied > 0) {
      addToast(
        `Applied ${applied} ${applied === 1 ? "change" : "changes"}. Undo reverts them all.`,
        "success"
      );
    } else {
      addToast("The map changed since this review — nothing was applied.", "info");
    }
    onClose();
  };

  return (
    <Modal
      title="Fix my mindmap"
      description="The AI looks over your map's structure and suggests changes. Nothing is applied until you say so."
      onClose={onClose}
      className="max-w-lg"
    >
      {tooSmall ? (
        <p className="text-[13px] leading-relaxed text-zinc-400">
          This map is still small — a structure review helps once there are a few
          more ideas on the canvas. Add some and come back when you&apos;re ready.
        </p>
      ) : phase === "loading" ? (
        <div className="flex items-center gap-3 py-6 text-[13px] text-zinc-400">
          <Loader2 size={16} className="animate-spin text-zinc-500" />
          <span>Reading your map…</span>
        </div>
      ) : phase === "error" ? (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] leading-relaxed text-zinc-400">
            {error ?? "That didn't work."}
          </p>
          <Button className="w-full gap-2" onClick={() => void requestReview()}>
            Try again
          </Button>
        </div>
      ) : operations.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-zinc-400">
          The structure looks sound — nothing to change right now.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
              {operations.length} suggested {operations.length === 1 ? "change" : "changes"}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAccepted(new Set(operations.map((_, i) => i)))}
                className="text-[12px] text-zinc-400 transition-colors hover:text-emerald-300"
              >
                Accept all
              </button>
              <span className="h-3 w-px bg-white/10" />
              <button
                type="button"
                onClick={() => setAccepted(new Set())}
                className="text-[12px] text-zinc-400 transition-colors hover:text-zinc-200"
              >
                Reject all
              </button>
            </div>
          </div>

          <div className="custom-scrollbar flex max-h-[320px] flex-col gap-2 overflow-y-auto pr-1">
            {operations.map((op, index) => {
              const isAccepted = acceptedSet.has(index);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggle(index)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
                    isAccepted
                      ? "border-emerald-500/25 bg-emerald-500/[0.06]"
                      : "border-white/[0.05] bg-white/[0.02] opacity-60 hover:opacity-90"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition-all",
                      isAccepted
                        ? "border-emerald-500 bg-emerald-500 text-zinc-950"
                        : "border-white/15 text-transparent"
                    )}
                  >
                    <Check size={11} strokeWidth={3} />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[13px] font-medium text-zinc-200">
                      {describeOperation(op, labelOf)}
                    </span>
                    {op.reason && (
                      <span className="text-[12px] leading-relaxed text-zinc-500">
                        {op.reason}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleApply}
            disabled={acceptedSet.size === 0}
          >
            <Wrench size={14} />
            {acceptedSet.size === 0
              ? "Nothing selected"
              : `Apply ${acceptedSet.size} ${acceptedSet.size === 1 ? "change" : "changes"}`}
          </Button>
        </div>
      )}
    </Modal>
  );
}

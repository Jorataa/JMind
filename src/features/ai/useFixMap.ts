"use client";

import { useCallback, useState } from "react";
import { useMindMapStore } from "@/stores/use-mindmap-store";
import type { FixOperation } from "@/lib/mindmap-fix";

// ─────────────────────────────────────────────────────────────────────────────
// Client-side glue for "Fix my mindmap".
//
// Serializes the current map (idea nodes only — sticky notes are freeform
// thoughts, not structure), asks /api/ai/fix-map for proposals, and holds them
// for the review modal. Nothing here changes the map; applying is a separate,
// user-driven step through the store.
// ─────────────────────────────────────────────────────────────────────────────

/** A map needs at least this many idea nodes before a structure review is useful. */
export const MIN_NODES_FOR_FIX = 3;

export type FixMapPhase = "idle" | "loading" | "review" | "error";

const isFreeformEdge = (edge: { data?: Record<string, unknown>; className?: string }) =>
  edge.data?.freeform === true ||
  (typeof edge.className === "string" && edge.className.includes("freeform-edge"));

export function useFixMap() {
  const [phase, setPhase] = useState<FixMapPhase>("idle");
  const [operations, setOperations] = useState<FixOperation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const requestReview = useCallback(async () => {
    const state = useMindMapStore.getState();
    const ideaNodes = state.nodes.filter((n) => (n.type ?? "editable") === "editable");
    const ideaNodeIds = new Set(ideaNodes.map((n) => n.id));

    setPhase("loading");
    setError(null);

    try {
      const response = await fetch("/api/ai/fix-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: state.maps[state.activeMapId]?.title ?? "",
          nodes: ideaNodes.map((n) => ({
            id: n.id,
            label: n.data.label,
            category: n.data.category,
            isRoot: n.data.isRoot === true,
          })),
          edges: state.edges
            .filter((e) => ideaNodeIds.has(e.source) && ideaNodeIds.has(e.target))
            .map((e) => ({
              source: e.source,
              target: e.target,
              freeform: isFreeformEdge(e),
            })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error ?? "Review failed.");

      setOperations(Array.isArray(data.operations) ? data.operations : []);
      setPhase("review");
    } catch (err) {
      console.error("[Jorata AI] fix-map review failed:", err);
      setError(err instanceof Error ? err.message : "Couldn't review the map.");
      setPhase("error");
    }
  }, []);

  return { phase, operations, error, requestReview };
}

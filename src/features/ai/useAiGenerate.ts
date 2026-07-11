"use client";

import { useCallback, useState } from "react";
import { useMindMapStore } from "@/stores/use-mindmap-store";
import { useToastStore } from "@/stores/use-toast-store";
import type { AiTreeNode, AiChildIdea } from "@/lib/mindmap-ai";

// ─────────────────────────────────────────────────────────────────────────────
// Client-side glue for AI mind-map generation + node expansion.
//
// The network call + store mutation live here so the UI components stay purely
// presentational. Every result lands as PROPOSED material (§6.6) — the user
// keeps or discards it via the proposal bar.
//
// All calls are cancelable (§5.1): one in-flight controller at a time, aborted
// by Esc anywhere on the canvas.
// ─────────────────────────────────────────────────────────────────────────────

let activeController: AbortController | null = null;

/** Abort the in-flight AI call, if any. Returns whether one was aborted. */
export function abortActiveAi(): boolean {
  if (!activeController) return false;
  activeController.abort();
  activeController = null;
  return true;
}

const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError";

/**
 * Drives map generation: POSTs the topic and lands the resulting tree as a
 * proposed map. With `intoMapId` (regenerate/refine) the active map's contents
 * are replaced in one undoable step instead of creating a new workspace.
 * Returns whether it succeeded so callers can keep their UI open for a retry.
 */
export function useAiGenerate() {
  const [isLoading, setIsLoading] = useState(false);

  const generate = useCallback(
    async (prompt: string, options?: { intoMapId?: string }): Promise<boolean> => {
      const topic = prompt.trim();
      if (!topic || isLoading) return false;

      setIsLoading(true);
      const controller = new AbortController();
      activeController = controller;
      try {
        const response = await fetch("/api/ai/mindmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: topic }),
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.error ?? "Generation failed.");

        const tree = data.tree as AiTreeNode;
        useMindMapStore.getState().actions.generateMapFromTree(tree, options?.intoMapId);
        const proposedCount = useMindMapStore
          .getState()
          .nodes.filter((n) => n.data.proposed).length;
        useToastStore
          .getState()
          .addToast(`Jorata proposed ${proposedCount} ideas`, "success");
        return true;
      } catch (error) {
        if (isAbortError(error)) return false;
        console.error("[Jorata AI] generate failed:", error);
        useToastStore.getState().addToast("Unable to generate mind map.", "error");
        return false;
      } finally {
        if (activeController === controller) activeController = null;
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  return { generate, isLoading };
}

export type ExpandMode = "expand" | "simplify" | "counter";

const MODE_VERB: Record<ExpandMode, string> = {
  expand: "Expanding",
  simplify: "Simplifying",
  counter: "Countering",
};

/**
 * Grows one node with AI-proposed children — expand, simplify or counter
 * (§6.6 node toolbar verbs). Standalone (not a hook) so it can be fired from
 * a context menu that unmounts the instant it's clicked — it reads fresh state
 * straight from the stores and appends on completion.
 */
export async function expandNodeWithAi(
  nodeId: string,
  mode: ExpandMode = "expand"
): Promise<void> {
  const store = useMindMapStore.getState();
  const node = store.nodes.find((n) => n.id === nodeId);
  if (!node) return;

  const addToast = useToastStore.getState().addToast;
  const rootTitle = store.nodes.find((n) => n.data.isRoot)?.data.label ?? "";

  addToast(`${MODE_VERB[mode]} "${node.data.label}"…`, "info");

  const controller = new AbortController();
  activeController = controller;
  try {
    const response = await fetch("/api/ai/expand-node", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ node: node.data.label, root: rootTitle, mode }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error ?? "Expansion failed.");

    // The route returns structured children; coerce defensively so a stray
    // plain-string entry still creates a node (just without the extras).
    const ideas: AiChildIdea[] = (Array.isArray(data.children) ? data.children : [])
      .map((child: unknown): AiChildIdea =>
        typeof child === "string"
          ? { title: child }
          : {
              title: String((child as AiChildIdea)?.title ?? "").trim(),
              description: (child as AiChildIdea)?.description,
              category: (child as AiChildIdea)?.category,
            }
      )
      .filter((idea: AiChildIdea) => idea.title.length > 0);
    if (ideas.length === 0) {
      addToast("No suggestions returned. Try again.", "error");
      return;
    }

    useMindMapStore.getState().actions.expandNodeWithChildren(nodeId, ideas);
    addToast(`Jorata proposed ${ideas.length} ideas under "${node.data.label}"`, "success");
  } catch (error) {
    if (isAbortError(error)) return;
    console.error("[Jorata AI] expand failed:", error);
    addToast("Unable to expand this node.", "error");
  } finally {
    if (activeController === controller) activeController = null;
  }
}

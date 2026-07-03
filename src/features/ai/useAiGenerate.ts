"use client";

import { useCallback, useState } from "react";
import { useMindMapStore } from "@/stores/use-mindmap-store";
import { useToastStore } from "@/stores/use-toast-store";
import type { AiTreeNode, AiChildIdea } from "@/lib/mindmap-ai";

// ─────────────────────────────────────────────────────────────────────────────
// Client-side glue for AI mind-map generation + node expansion.
//
// The network call + store mutation live here so the UI components stay purely
// presentational.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Drives the "AI Generate" modal: POSTs the topic, drops the resulting tree onto
 * a fresh canvas, and reports success/failure. Returns whether it succeeded so
 * the modal can stay open (for a retry) on failure.
 */
export function useAiGenerate() {
  const [isLoading, setIsLoading] = useState(false);

  const generate = useCallback(async (prompt: string): Promise<boolean> => {
    const topic = prompt.trim();
    if (!topic || isLoading) return false;

    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/mindmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: topic }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error ?? "Generation failed.");

      const tree = data.tree as AiTreeNode;
      useMindMapStore.getState().actions.generateMapFromTree(tree);
      useToastStore.getState().addToast(`Generated "${tree.title}"`, "success");
      return true;
    } catch (error) {
      console.error("[Jorata AI] generate failed:", error);
      useToastStore.getState().addToast("Unable to generate mind map.", "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  return { generate, isLoading };
}

/**
 * Expands one node with AI-suggested children. Standalone (not a hook) so it can
 * be fired from a context menu that unmounts the instant it's clicked — it reads
 * fresh state straight from the stores and appends on completion.
 */
export async function expandNodeWithAi(nodeId: string): Promise<void> {
  const store = useMindMapStore.getState();
  const node = store.nodes.find((n) => n.id === nodeId);
  if (!node) return;

  const addToast = useToastStore.getState().addToast;
  const rootTitle = store.nodes.find((n) => n.data.isRoot)?.data.label ?? "";

  addToast(`Expanding "${node.data.label}"…`, "info");

  try {
    const response = await fetch("/api/ai/expand-node", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ node: node.data.label, root: rootTitle }),
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
    addToast(`Added ${ideas.length} ideas to "${node.data.label}"`, "success");
  } catch (error) {
    console.error("[Jorata AI] expand failed:", error);
    addToast("Unable to expand this node.", "error");
  }
}

import type { MindMapNode, MindMapEdge } from "@/types/mindmap";
import { MindMapService } from "@/services/mindmap-service";

// ─────────────────────────────────────────────────────────────────────────────
// AI mind-map shaping.
//
// Pure helpers (no React, no store) that turn the loose JSON Gemini returns into
// (a) a validated, depth-/breadth-capped tree, and (b) React Flow nodes + edges
// ready for the canvas. Kept side-effect free so they're trivial to reason about
// and reuse from both the API route and the store.
// ─────────────────────────────────────────────────────────────────────────────

/** The recursive shape Gemini is asked to produce. */
export interface AiTreeNode {
  title: string;
  children: AiTreeNode[];
}

// Guardrails matching the prompt's contract — also our defence against a model
// that ignores them and returns something huge or malformed.
const MAX_DEPTH = 4; // levels INCLUDING the root
const MAX_CHILDREN = 6;
const MAX_TITLE_CHARS = 80;

// Must match ROOT_NODE_ID in the mind-map store. Duplicated (not imported) to
// keep this module free of any store/client dependency.
const ROOT_ID = "root";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const cleanTitle = (value: unknown): string =>
  String(isRecord(value) ? "" : value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TITLE_CHARS);

/**
 * Coerces arbitrary parsed JSON into a safe AiTreeNode, enforcing the depth,
 * children-count and title-length caps. Returns null when there isn't even a
 * usable title at the root.
 */
export function normalizeAiTree(raw: unknown, depth = 1): AiTreeNode | null {
  if (!isRecord(raw)) return null;

  const title = cleanTitle(raw.title);
  if (!title) return null;

  let children: AiTreeNode[] = [];
  if (depth < MAX_DEPTH && Array.isArray(raw.children)) {
    children = raw.children
      .slice(0, MAX_CHILDREN)
      .map((child) => normalizeAiTree(child, depth + 1))
      .filter((child): child is AiTreeNode => child !== null);
  }

  return { title, children };
}

/** Pulls the direct child titles off a tree — used by the "expand node" flow. */
export function childTitles(tree: AiTreeNode): string[] {
  return tree.children.map((child) => child.title).filter(Boolean);
}

/**
 * Builds a fully-formed mind-map node. Mirrors MindMapService.createNode's data
 * shape, but with `isNew: false` — generated nodes must NOT pop into edit mode
 * the way a single hand-added node does. Position is a placeholder; the tree
 * layout assigns the real coordinates afterwards.
 */
function buildNode(id: string, label: string, isRoot: boolean): MindMapNode {
  const now = new Date().toISOString();
  return {
    id,
    type: "editable",
    position: { x: 0, y: 0 },
    data: {
      label,
      category: "default",
      priority: "none",
      status: "none",
      isRoot,
      isNew: false,
      linkedTaskIds: [],
      linkedKpiIds: [],
      tags: [],
      createdAt: now,
      updatedAt: now,
    },
  };
}

/**
 * Converts a validated AiTreeNode into React Flow nodes + edges. The root is
 * given the canonical ROOT_ID so the store treats it as the protected root;
 * every other node gets a fresh UUID. Edges are parent → child. Positions are
 * left at the origin — run a tree layout (calculateTreeLayout) on the result to
 * place them.
 */
export function mindMapTreeToFlow(tree: AiTreeNode): {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
} {
  const nodes: MindMapNode[] = [];
  const edges: MindMapEdge[] = [];

  const walk = (node: AiTreeNode, id: string, isRoot: boolean) => {
    nodes.push(buildNode(id, node.title, isRoot));
    for (const child of node.children) {
      const childId = crypto.randomUUID();
      edges.push(MindMapService.createEdge(id, childId));
      walk(child, childId, false);
    }
  };

  walk(tree, ROOT_ID, true);
  return { nodes, edges };
}

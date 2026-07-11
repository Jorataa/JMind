import type { MindMapNode, MindMapEdge, NodeCategory } from "@/types/mindmap";
import { MindMapService } from "@/services/mindmap-service";
import { branchColorAt } from "@/lib/node-colors";

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
  /** Why the AI added this node — optional; nodes render fine without it. */
  description?: string;
  /** Suggested category; anything unrecognized falls back to "default". */
  category?: NodeCategory;
  children: AiTreeNode[];
}

/** One AI-suggested child node — the "expand node" flow's unit of work. */
export interface AiChildIdea {
  title: string;
  description?: string;
  category?: NodeCategory;
}

// Guardrails matching the prompt's contract — also our defence against a model
// that ignores them and returns something huge or malformed.
const MAX_DEPTH = 4; // levels INCLUDING the root
const MAX_CHILDREN = 6;
const MAX_TITLE_CHARS = 80;
const MAX_DESCRIPTION_CHARS = 140;

const AI_CATEGORIES = new Set<NodeCategory>(["default", "goal", "task", "idea", "warning"]);

// Must match ROOT_NODE_ID in the mind-map store. Duplicated (not imported) to
// keep this module free of any store/client dependency.
const ROOT_ID = "root";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const cleanText = (value: unknown, maxChars: number): string =>
  String(isRecord(value) ? "" : value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxChars);

const cleanTitle = (value: unknown): string => cleanText(value, MAX_TITLE_CHARS);

/** Description and category are best-effort — malformed values become undefined,
 * never an error, so a node is always created even when the AI skipped them. */
const cleanDescription = (value: unknown): string | undefined => {
  const text = cleanText(value, MAX_DESCRIPTION_CHARS);
  return text.length > 0 ? text : undefined;
};

const cleanCategory = (value: unknown): NodeCategory | undefined => {
  const category = String(value ?? "").trim().toLowerCase() as NodeCategory;
  return AI_CATEGORIES.has(category) ? category : undefined;
};

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

  return {
    title,
    description: cleanDescription(raw.description),
    category: cleanCategory(raw.category),
    children,
  };
}

/** Pulls the direct children off a tree — used by the "expand node" flow. */
export function childIdeas(tree: AiTreeNode): AiChildIdea[] {
  return tree.children
    .filter((child) => Boolean(child.title))
    .map(({ title, description, category }) => ({ title, description, category }));
}

/**
 * Builds a fully-formed mind-map node. Mirrors MindMapService.createNode's data
 * shape, but with `isNew: false` — generated nodes must NOT pop into edit mode
 * the way a single hand-added node does. Position is a placeholder; the tree
 * layout assigns the real coordinates afterwards.
 */
function buildNode(
  id: string,
  source: AiTreeNode,
  isRoot: boolean,
  branchColor?: string
): MindMapNode {
  const now = new Date().toISOString();
  return {
    id,
    type: "editable",
    position: { x: 0, y: 0 },
    data: {
      label: source.title,
      category: source.category ?? "default",
      priority: "none",
      status: "none",
      isRoot,
      isNew: false,
      // Optional — spread only when present so nodes without one match the
      // manual-node shape exactly.
      ...(source.description ? { aiDescription: source.description } : {}),
      ...(branchColor ? { color: branchColor } : {}),
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
 *
 * With `proposed`, every non-root node lands as AI-proposed material (§6.6):
 * sage/dashed on the canvas, edges dashed, revealed with a 60ms stagger —
 * until the user keeps or discards it.
 */
export function mindMapTreeToFlow(
  tree: AiTreeNode,
  options?: { proposed?: boolean }
): {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
} {
  const nodes: MindMapNode[] = [];
  const edges: MindMapEdge[] = [];
  const proposed = options?.proposed ?? false;
  let revealOrder = 0;

  // Each main branch (direct child of the root) gets its own hue; everything
  // deeper inherits it, so whole branches stay traceable by color. The root
  // keeps its emerald treatment (no branch color).
  const walk = (node: AiTreeNode, id: string, isRoot: boolean, branchColor?: string) => {
    const built = buildNode(id, node, isRoot, branchColor);
    if (proposed && !isRoot) {
      built.data.proposed = true;
      built.data.staggerIndex = revealOrder++;
    }
    nodes.push(built);
    node.children.forEach((child, index) => {
      const childId = crypto.randomUUID();
      const edge = MindMapService.createEdge(id, childId);
      if (proposed) edge.className = "proposed-edge";
      edges.push(edge);
      walk(child, childId, false, isRoot ? branchColorAt(index) : branchColor);
    });
  };

  walk(tree, ROOT_ID, true);
  return { nodes, edges };
}

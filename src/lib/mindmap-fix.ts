import type { MindMapNode, MindMapEdge, NodeCategory } from "@/types/mindmap";
import { MindMapService } from "@/services/mindmap-service";

// ─────────────────────────────────────────────────────────────────────────────
// "Fix my mindmap" — shared shaping for AI-proposed structure changes.
//
// Pure helpers (no React, no store) used on both sides of the flow:
// - the /api/ai/fix-map route validates Gemini's raw operation list with
//   normalizeFixOperations before it ever reaches the client
// - the store applies the user-ACCEPTED subset with applyFixOperations,
//   which re-checks every operation against the live map (it may have
//   changed since the proposal) and silently skips anything unsafe.
//
// Nothing here mutates its inputs; the store wraps one call in one undo
// snapshot so the whole batch reverts with a single Ctrl+Z.
// ─────────────────────────────────────────────────────────────────────────────

export type FixOperationType = "connect" | "move" | "recategorize" | "rename" | "merge";

export interface FixOperation {
  type: FixOperationType;
  /** The node the operation acts on. Never the root. */
  nodeId: string;
  /** connect/move: the parent to attach the node under (solid edge). */
  parentId?: string;
  /** merge: the surviving node that absorbs nodeId. */
  intoNodeId?: string;
  /** recategorize: the corrected category. */
  category?: NodeCategory;
  /** rename: the clearer label. */
  label?: string;
  /** One calm sentence explaining why — shown in the review list. */
  reason: string;
}

// Bounds on what we accept back from the model — a runaway operation list
// would make the review UI useless and the batch-apply risky.
const MAX_OPERATIONS = 20;
const MAX_LABEL_CHARS = 80;
const MAX_REASON_CHARS = 160;

const OPERATION_TYPES = new Set<FixOperationType>([
  "connect",
  "move",
  "recategorize",
  "rename",
  "merge",
]);

const VALID_CATEGORIES = new Set<NodeCategory>(["default", "goal", "task", "idea", "warning"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const cleanText = (value: unknown, maxChars: number): string =>
  String(isRecord(value) || Array.isArray(value) ? "" : value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxChars);

/**
 * Validates the raw JSON Gemini returned into a safe, bounded operation list.
 * Every id must be one we actually sent (no hallucinated targets), the root is
 * untouchable, and malformed entries are dropped — never an error.
 */
export function normalizeFixOperations(
  raw: unknown,
  validNodeIds: Set<string>,
  rootId: string
): FixOperation[] {
  const list = isRecord(raw) && Array.isArray(raw.operations) ? raw.operations : [];
  const operations: FixOperation[] = [];

  for (const entry of list) {
    if (operations.length >= MAX_OPERATIONS) break;
    if (!isRecord(entry)) continue;

    const type = String(entry.type ?? "").trim().toLowerCase() as FixOperationType;
    const nodeId = String(entry.nodeId ?? "").trim();
    const reason = cleanText(entry.reason, MAX_REASON_CHARS);

    // The node being changed must exist and must not be the root.
    if (!OPERATION_TYPES.has(type)) continue;
    if (!validNodeIds.has(nodeId) || nodeId === rootId) continue;

    if (type === "connect" || type === "move") {
      const parentId = String(entry.parentId ?? "").trim();
      if (!validNodeIds.has(parentId) || parentId === nodeId) continue;
      operations.push({ type, nodeId, parentId, reason });
    } else if (type === "recategorize") {
      const category = String(entry.category ?? "").trim().toLowerCase() as NodeCategory;
      if (!VALID_CATEGORIES.has(category)) continue;
      operations.push({ type, nodeId, category, reason });
    } else if (type === "rename") {
      const label = cleanText(entry.label, MAX_LABEL_CHARS);
      if (!label) continue;
      operations.push({ type, nodeId, label, reason });
    } else if (type === "merge") {
      const intoNodeId = String(entry.intoNodeId ?? "").trim();
      if (!validNodeIds.has(intoNodeId) || intoNodeId === nodeId || intoNodeId === rootId)
        continue;
      operations.push({ type, nodeId, intoNodeId, reason });
    }
  }

  return operations;
}

/** Freeform (hand-drawn) edges are lateral links, not hierarchy — they never
 * count as a parent relationship and are never removed by a move. */
const isFreeform = (edge: MindMapEdge) =>
  edge.data?.freeform === true ||
  (typeof edge.className === "string" && edge.className.includes("freeform-edge"));

/** All structural descendants of `nodeId` — used to refuse moves that would
 * create a cycle (a node can't become a child of its own subtree). */
const collectDescendants = (nodeId: string, edges: MindMapEdge[]): Set<string> => {
  const childrenOf = new Map<string, string[]>();
  for (const edge of edges) {
    if (isFreeform(edge)) continue;
    const list = childrenOf.get(edge.source);
    if (list) list.push(edge.target);
    else childrenOf.set(edge.source, [edge.target]);
  }

  const descendants = new Set<string>();
  const queue = [nodeId];
  while (queue.length > 0) {
    const current = queue.pop()!;
    for (const child of childrenOf.get(current) ?? []) {
      if (!descendants.has(child)) {
        descendants.add(child);
        queue.push(child);
      }
    }
  }
  return descendants;
};

export interface ApplyFixResult {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  /** How many operations actually changed something. */
  applied: number;
}

const dedupeStrings = (a: string[], b: string[]) => Array.from(new Set([...a, ...b]));

/**
 * Applies the accepted operations to a copy of the map. The map may have
 * changed since the AI looked at it, so every operation re-validates against
 * the current state and is skipped (not errored) when it no longer applies —
 * a half-applied batch must never leave the map broken.
 */
export function applyFixOperations(
  nodes: MindMapNode[],
  edges: MindMapEdge[],
  operations: FixOperation[],
  rootId: string
): ApplyFixResult {
  let nextNodes = [...nodes];
  let nextEdges = [...edges];
  let applied = 0;
  const now = new Date().toISOString();

  const findNode = (id: string) => nextNodes.find((n) => n.id === id);
  const isIdeaNode = (node: MindMapNode | undefined): node is MindMapNode =>
    Boolean(node && (node.type ?? "editable") === "editable");

  const updateData = (id: string, updates: Partial<MindMapNode["data"]>) => {
    nextNodes = nextNodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, ...updates, updatedAt: now } } : n
    );
  };

  const structuralParentEdges = (nodeId: string) =>
    nextEdges.filter((e) => e.target === nodeId && !isFreeform(e));

  for (const op of operations) {
    const node = findNode(op.nodeId);
    if (!isIdeaNode(node) || op.nodeId === rootId) continue;

    if (op.type === "connect" || op.type === "move") {
      const parent = findNode(op.parentId ?? "");
      if (!isIdeaNode(parent)) continue;
      // Attaching under a descendant would orphan the whole subtree in a loop.
      if (collectDescendants(op.nodeId, nextEdges).has(parent.id)) continue;

      const parentEdges = structuralParentEdges(op.nodeId);
      if (op.type === "connect" && parentEdges.length > 0) continue; // no longer an orphan
      if (parentEdges.some((e) => e.source === parent.id)) continue; // already there

      if (op.type === "move") {
        const removed = new Set(parentEdges.map((e) => e.id));
        nextEdges = nextEdges.filter((e) => !removed.has(e.id));
      }
      nextEdges = [...nextEdges, MindMapService.createEdge(parent.id, op.nodeId)];
      applied++;
    } else if (op.type === "recategorize") {
      if (!op.category || node.data.category === op.category) continue;
      updateData(op.nodeId, { category: op.category });
      applied++;
    } else if (op.type === "rename") {
      if (!op.label || node.data.label === op.label) continue;
      updateData(op.nodeId, { label: op.label });
      applied++;
    } else if (op.type === "merge") {
      const target = findNode(op.intoNodeId ?? "");
      if (!isIdeaNode(target)) continue;

      // Carry links over so merging never silently detaches a task or goal.
      updateData(target.id, {
        linkedTaskIds: dedupeStrings(target.data.linkedTaskIds, node.data.linkedTaskIds),
        linkedKpiIds: dedupeStrings(target.data.linkedKpiIds, node.data.linkedKpiIds),
        tags: dedupeStrings(target.data.tags, node.data.tags),
      });

      // Re-point the merged node's connections at the survivor, drop the node.
      nextEdges = nextEdges
        .map((e) => {
          if (e.source === op.nodeId) return { ...e, source: target.id };
          if (e.target === op.nodeId) return { ...e, target: target.id };
          return e;
        })
        .filter((e) => e.source !== e.target);
      nextNodes = nextNodes.filter((n) => n.id !== op.nodeId);
      applied++;
    }
  }

  // Merges can leave re-pointed edges with stale ids that now collide.
  const seen = new Set<string>();
  nextEdges = nextEdges
    .map((e) => {
      const id = `edge-${e.source}-${e.sourceHandle ?? "source"}-${e.target}-${e.targetHandle ?? "target"}`;
      return e.id === id ? e : { ...e, id };
    })
    .filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });

  return { nodes: nextNodes, edges: nextEdges, applied };
}

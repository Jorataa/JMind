import { MindMapNode, MindMapEdge } from "@/types/mindmap";

/**
 * Given the nodes and edges, returns the set of node ids that should be hidden
 * because a collapsed ancestor sits above them.
 *
 * A node is hidden if any node on a parent→child path above it has
 * `data.collapsed === true`. Pure and cycle-safe (a `seen` guard stops the
 * traversal from looping on cross-linked maps), so it can be unit-tested
 * without the canvas.
 */
export function getHiddenNodeIds(
  nodes: MindMapNode[],
  edges: MindMapEdge[]
): Set<string> {
  // parent id → direct child ids
  const children = new Map<string, string[]>();
  for (const edge of edges) {
    const list = children.get(edge.source);
    if (list) list.push(edge.target);
    else children.set(edge.source, [edge.target]);
  }

  const hidden = new Set<string>();

  for (const node of nodes) {
    if (node.data?.collapsed !== true) continue;

    // Hide every descendant of this collapsed node.
    const stack = [...(children.get(node.id) ?? [])];
    while (stack.length > 0) {
      const id = stack.pop()!;
      if (hidden.has(id)) continue;
      hidden.add(id);
      const next = children.get(id);
      if (next) stack.push(...next);
    }
  }

  return hidden;
}

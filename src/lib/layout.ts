import { MindMapNode, MindMapEdge } from "@/types/mindmap";

/**
 * Simple tree layout algorithm for the mind map.
 * Arranges nodes in a horizontal tree structure.
 */
export function calculateTreeLayout(nodes: MindMapNode[], edges: MindMapEdge[]) {
  const rootNode = nodes.find((n) => n.data.isRoot) || nodes[0];
  if (!rootNode) return nodes;

  const adj = new Map<string, string[]>();
  
  edges.forEach((edge) => {
    const list = adj.get(edge.source) || [];
    list.push(edge.target);
    adj.set(edge.source, list);
  });

  const HORIZONTAL_GAP = 250;
  const VERTICAL_GAP = 80;

  const positionedNodes = new Map<string, { x: number; y: number }>();
  
  // Track the height of each subtree to center parents
  function layoutSubtree(nodeId: string, depth: number, startY: number): number {
    const children = adj.get(nodeId) || [];
    
    if (children.length === 0) {
      positionedNodes.set(nodeId, { x: depth * HORIZONTAL_GAP, y: startY });
      return VERTICAL_GAP;
    }

    let currentY = startY;
    children.forEach((childId) => {
      currentY += layoutSubtree(childId, depth + 1, currentY);
    });

    const totalHeight = currentY - startY;
    const centerY = startY + (totalHeight - VERTICAL_GAP) / 2;
    
    positionedNodes.set(nodeId, { x: depth * HORIZONTAL_GAP, y: centerY });
    
    return totalHeight;
  }

  layoutSubtree(rootNode.id, 0, 0);

  return nodes.map((node) => {
    const pos = positionedNodes.get(node.id);
    if (pos) {
      return { ...node, position: pos };
    }
    return node;
  });
}

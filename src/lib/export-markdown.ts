import { MindMapNode, MindMapEdge } from "@/types/mindmap";

/**
 * Converts the mind map tree into a nested Markdown outline.
 */
export function exportToMarkdown(nodes: MindMapNode[], edges: MindMapEdge[]): string {
  const rootNode = nodes.find((n) => n.data.isRoot) || nodes[0];
  if (!rootNode) return "";

  const adj = new Map<string, string[]>();
  edges.forEach((edge) => {
    const list = adj.get(edge.source) || [];
    list.push(edge.target);
    adj.set(edge.source, list);
  });

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  let markdown = "";

  function traverse(nodeId: string, depth: number) {
    const node = nodeMap.get(nodeId);
    if (!node) return;

    const indent = "  ".repeat(depth);
    const prefix = depth === 0 ? "# " : "- ";
    
    markdown += `${indent}${prefix}${node.data.label}\n`;
    
    if (node.data.description) {
      const descIndent = "  ".repeat(depth + 1);
      markdown += `${descIndent}${node.data.description}\n`;
    }

    const children = adj.get(nodeId) || [];
    children.forEach((childId) => traverse(childId, depth + 1));
  }

  traverse(rootNode.id, 0);
  return markdown;
}

/**
 * Triggers a download of the generated Markdown content.
 */
export function downloadMarkdown(content: string, fileName: string = "jmind-outline.md") {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

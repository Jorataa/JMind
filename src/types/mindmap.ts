import { Edge, Node, Viewport } from "@xyflow/react";

export type NodeCategory = "default" | "goal" | "task" | "idea" | "warning";
export type NodePriority = "high" | "medium" | "low" | "none";
export type NodeStatus = "todo" | "doing" | "done" | "none";

export type MindMapNodeData = {
  label: string;
  description?: string;
  category: NodeCategory;
  priority: NodePriority;
  status: NodeStatus;
  isRoot?: boolean;
  isNew?: boolean;
  /** When true, this node's descendants are hidden on the canvas. */
  collapsed?: boolean;
  color?: string;
  linkedTaskIds: string[];
  linkedKpiIds: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
} & Record<string, unknown>;

export type MindMapNode = Node<MindMapNodeData>;
export type MindMapEdge = Edge;

export interface MindMapWorkspace {
  id: string;
  title: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  viewport: Viewport;
  createdAt: string;
  updatedAt: string;
}

export interface MindMapData {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

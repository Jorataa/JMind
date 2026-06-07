import { MindMapData, MindMapNode } from "@/types/mindmap";
import { Edge, Connection, addEdge } from "@xyflow/react";

/**
 * Service for Mind Map business logic and data orchestration.
 * Prepares the application for future Prisma/PostgreSQL integration.
 */
export const MindMapService = {
  /**
   * Creates a new node with default values
   */
  createNode: (label: string = "New Idea"): MindMapNode => {
    const now = new Date().toISOString();
    return {
      id: `node-${Date.now()}`,
      type: "editable",
      position: { x: Math.random() * 400 - 200, y: Math.random() * 400 - 200 },
      data: {
        label,
        category: "default",
        priority: "none",
        status: "none",
        linkedTaskIds: [],
        linkedKpiIds: [],
        tags: [],
        createdAt: now,
        updatedAt: now,
        isNew: true,
      },
    };
  },

  /**
   * Duplicates an existing node
   */
  duplicateNode: (node: MindMapNode): MindMapNode => {
    const now = new Date().toISOString();
    return {
      ...node,
      id: `node-${Date.now()}`,
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      selected: false,
      data: {
        ...node.data,
        label: `${node.data.label} (Copy)`,
        isRoot: false,
        isNew: false,
        createdAt: now,
        updatedAt: now,
      },
    };
  },

  /**
   * Handles connecting two nodes
   */
  connect: (connection: Connection, existingEdges: Edge[]): Edge[] => {
    if (!connection.source || !connection.target) {
      return [...existingEdges];
    }

    const edgeId = `edge-${connection.source}-${connection.sourceHandle ?? "source"}-${connection.target}-${connection.targetHandle ?? "target"}`;

    return addEdge(
      { 
        id: edgeId,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        animated: true, 
        style: { stroke: "rgba(212,212,216,0.35)", strokeWidth: 2 } 
      }, 
      existingEdges
    );
  },

  /**
   * Mock for future backend sync
   */
  sync: async (data: MindMapData): Promise<void> => {
    console.log("MindMapService: Syncing with backend...", data);
    return new Promise((resolve) => setTimeout(resolve, 300));
  },
};

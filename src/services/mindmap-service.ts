import { MindMapData, MindMapNode, MindMapEdge } from "@/types/mindmap";
import { Edge, Connection, addEdge } from "@xyflow/react";

const CHILD_OFFSET_X = 240;
const SIBLING_GAP_Y = 96;

/**
 * Fans children out vertically around the parent: first child sits level with
 * the parent, then siblings alternate below/above so branches stay readable
 * without manual arranging.
 */
const childPosition = (parent: MindMapNode, siblingIndex: number) => {
  const magnitude = Math.ceil(siblingIndex / 2) * SIBLING_GAP_Y;
  const direction = siblingIndex % 2 === 1 ? 1 : -1;

  return {
    x: parent.position.x + CHILD_OFFSET_X,
    y: parent.position.y + (siblingIndex === 0 ? 0 : magnitude * direction),
  };
};

/**
 * Service for Mind Map business logic and data orchestration.
 * Prepares the application for future Prisma/PostgreSQL integration.
 */
export const MindMapService = {
  /**
   * Creates a new node. Position priority: explicit position (e.g. canvas
   * double-click) > computed slot next to parent > loose spot below origin.
   */
  createNode: (
    label: string = "New Idea",
    parentNode?: MindMapNode,
    position?: { x: number; y: number },
    siblingIndex: number = 0,
    type: string = "editable"
  ): MindMapNode => {
    const now = new Date().toISOString();

    const resolvedPosition =
      position ??
      (parentNode
        ? childPosition(parentNode, siblingIndex)
        : { x: 60 + Math.random() * 120, y: 140 + Math.random() * 100 });

    return {
      id: crypto.randomUUID(),
      type,
      position: resolvedPosition,
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
   * Creates a parent -> child edge. Appearance is owned by globals.css so all
   * edges stay consistent.
   */
  createEdge: (source: string, target: string): MindMapEdge => ({
    id: `edge-${source}-source-${target}-target`,
    source,
    target,
  }),

  /**
   * Duplicates an existing node
   */
  duplicateNode: (node: MindMapNode): MindMapNode => {
    const now = new Date().toISOString();
    return {
      ...node,
      id: crypto.randomUUID(),
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

    return addEdge(
      {
        id: `edge-${connection.source}-${connection.sourceHandle ?? "source"}-${connection.target}-${connection.targetHandle ?? "target"}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        // Hand-drawn = a lateral link, not a parent→child edge. The class (kept
        // through the edge sanitizer) renders it dashed via globals.css.
        className: "freeform-edge",
        data: { freeform: true },
      },
      existingEdges
    );
  },

  /**
   * Mock for future backend sync
   */
  sync: async (data: MindMapData): Promise<void> => {
    void data;
    return new Promise((resolve) => setTimeout(resolve, 300));
  },
};

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { MindMapNode, MindMapNodeData, MindMapEdge } from "@/types/mindmap";
import { MindMapService } from "@/services/mindmap-service";

export type {
  MindMapEdge,
  MindMapNode,
  MindMapNodeData,
  NodePriority,
  NodeStatus,
} from "@/types/mindmap";

interface MindMapState {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  selectedNodeId: string | null;
  sidebarOpen: boolean;
  
  actions: {
    setNodes: (nodes: MindMapNode[] | ((nodes: MindMapNode[]) => MindMapNode[])) => void;
    setEdges: (edges: MindMapEdge[] | ((edges: MindMapEdge[]) => MindMapEdge[])) => void;
    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => void;
    
    selectNode: (id: string | null) => void;
    toggleSidebar: (open?: boolean) => void;
    
    updateNodeLabel: (id: string, label: string) => void;
    updateNodeData: (id: string, updates: Partial<MindMapNodeData>) => void;
    addNode: (label?: string) => void;
    removeNode: (id: string) => void;
    duplicateNode: (id: string) => void;
  };
}

const ROOT_NODE_ID = "root";

const getEdgeId = (edge: Pick<MindMapEdge, "id" | "source" | "target" | "sourceHandle" | "targetHandle">) =>
  edge.id ||
  `edge-${edge.source}-${edge.sourceHandle ?? "source"}-${edge.target}-${edge.targetHandle ?? "target"}`;

const sanitizeEdges = (edges: MindMapEdge[]) =>
  edges
    .filter((edge) => edge.source && edge.target)
    .map((edge) => ({
      ...edge,
      id: getEdgeId(edge),
      source: edge.source,
      target: edge.target,
    }));

export const useMindMapStore = create<MindMapState>()(
  persist(
    (set, get) => ({
      nodes: [
        {
          id: ROOT_NODE_ID,
          type: "editable",
          position: { x: 0, y: 0 },
          data: {
            label: "JMind OS",
            category: "default",
            priority: "none",
            status: "none",
            isRoot: true,
            linkedTaskIds: [],
            linkedKpiIds: [],
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      ],
      edges: [],
      selectedNodeId: null,
      sidebarOpen: false,
      
      actions: {
        setNodes: (nodes) => set((state) => {
          const nextNodes = typeof nodes === "function" ? nodes(state.nodes) : nodes;

          return {
            nodes: nextNodes.map((node) => ({
              ...node,
              position: { ...node.position },
              data: { ...node.data },
            })),
          };
        }),
        setEdges: (edges) => set((state) => ({ 
          edges: sanitizeEdges(typeof edges === "function" ? edges(state.edges) : edges)
        })),
        
        onNodesChange: (changes) => set((state) => ({
          nodes: applyNodeChanges(changes, state.nodes) as MindMapNode[]
        })),
        
        onEdgesChange: (changes) => set((state) => ({
          edges: sanitizeEdges(applyEdgeChanges(changes, state.edges) as MindMapEdge[])
        })),
        
        onConnect: (connection: Connection) => {
          if (!connection.source || !connection.target) return;

          set((state) => ({
            edges: sanitizeEdges(MindMapService.connect(connection, state.edges) as MindMapEdge[])
          }));
        },
        
        selectNode: (id) => set((state) => ({
          selectedNodeId: id,
          sidebarOpen: id !== null,
          nodes: state.nodes.map((node) => {
            const selected = id !== null && node.id === id;
            return node.selected === selected ? node : { ...node, selected };
          }),
        })),
        toggleSidebar: (open) => set((state) => ({ sidebarOpen: open ?? !state.sidebarOpen })),

        updateNodeLabel: (id, label) => set((state) => {
          const now = new Date().toISOString();

          return {
            nodes: state.nodes.map((node) =>
              node.id === id
                ? { ...node, data: { ...node.data, label, updatedAt: now } }
                : node
            ),
          };
        }),
        
        updateNodeData: (id, updates) => set((state) => {
          const now = new Date().toISOString();

          return {
            nodes: state.nodes.map((node) =>
              node.id === id
                ? { ...node, data: { ...node.data, ...updates, updatedAt: now } }
                : node
            ),
          };
        }),
        
        addNode: (label) => {
          const newNode = MindMapService.createNode(label);
          set((state) => ({ nodes: [...state.nodes, newNode] }));
        },
        
        removeNode: (id) => set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== id),
          edges: state.edges.filter((e) => e.source !== id && e.target !== id),
          selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
          sidebarOpen: state.selectedNodeId === id ? false : state.sidebarOpen
        })),

        duplicateNode: (id) => {
          const node = get().nodes.find(n => n.id === id);
          if (!node) return;
          const newNode = MindMapService.duplicateNode(node);
          set((state) => ({ nodes: [...state.nodes, newNode] }));
        }
      }
    }),
    {
      name: "jmind:mindmap",
      partialize: (state) => ({ nodes: state.nodes, edges: state.edges }),
      merge: (persisted, current) => {
        const savedState = persisted as Partial<MindMapState>;

        return {
          ...current,
          ...savedState,
          nodes: savedState.nodes?.length ? savedState.nodes : current.nodes,
          edges: sanitizeEdges(savedState.edges ?? current.edges),
          actions: current.actions,
        };
      },
    }
  )
);

export const useMindMapActions = () => useMindMapStore((state) => state.actions);
export const useMindMapNodes = () => useMindMapStore((state) => state.nodes);
export const useMindMapEdges = () => useMindMapStore((state) => state.edges);
export const useSelectedNode = () => {
  const nodes = useMindMapStore((state) => state.nodes);
  const id = useMindMapStore((state) => state.selectedNodeId);
  return nodes.find(n => n.id === id) || null;
};

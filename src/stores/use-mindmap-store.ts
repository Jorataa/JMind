import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type Viewport,
} from "@xyflow/react";
import {
  MindMapNode,
  MindMapNodeData,
  MindMapEdge,
  MindMapWorkspace,
} from "@/types/mindmap";
import { MindMapService } from "@/services/mindmap-service";
import { calculateTreeLayout } from "@/lib/layout";
import { mindMapTreeToFlow, type AiTreeNode, type AiChildIdea } from "@/lib/mindmap-ai";
import { applyFixOperations, type FixOperation } from "@/lib/mindmap-fix";
import { useTaskStore } from "./use-task-store";
import { useActivityStore } from "./use-activity-store";

export type {
  MindMapEdge,
  MindMapNode,
  MindMapNodeData,
  NodePriority,
  NodeStatus,
  MindMapWorkspace,
} from "@/types/mindmap";

type HistoryEntry = {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
};

interface MindMapState {
  /** The collection of all workspaces. */
  maps: Record<string, MindMapWorkspace>;
  /** The currently active workspace ID. */
  activeMapId: string;
  
  // These remain at the top level for performance and ease of use with React Flow.
  // They represent the state of the CURRENTLY ACTIVE map.
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  viewport: Viewport;
  
  selectedNodeId: string | null;
  sidebarOpen: boolean;
  /**
   * One-shot "frame this node" request consumed by the canvas — set by
   * surfaces that navigate to a node (palette, cross-map search). Transient,
   * never persisted.
   */
  pendingFocusNodeId: string | null;
  /** Undo/redo history — per-tab session state, never persisted. */
  past: HistoryEntry[];
  future: HistoryEntry[];

  actions: {
    setNodes: (nodes: MindMapNode[] | ((nodes: MindMapNode[]) => MindMapNode[])) => void;
    setEdges: (edges: MindMapEdge[] | ((edges: MindMapEdge[]) => MindMapEdge[])) => void;
    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => void;
    onViewportChange: (viewport: Viewport) => void;
    resetViewport: () => void;

    selectNode: (id: string | null) => void;
    /** Select a node and ask the canvas to bring it into view. */
    requestNodeFocus: (id: string) => void;
    clearNodeFocus: () => void;
    openInspector: (id?: string) => void;
    toggleSidebar: (open?: boolean) => void;

    updateNodeLabel: (id: string, label: string) => void;
    updateNodeData: (id: string, updates: Partial<MindMapNodeData>) => void;
    addNode: (label?: string, parentId?: string, position?: { x: number; y: number }, type?: string) => MindMapNode;
    beginEditing: (id: string) => void;
    toggleNodeCollapse: (id: string) => void;
    removeNode: (id: string) => void;
    duplicateNode: (id: string) => void;
    convertNodeToTask: (id: string) => void;
    tidyMap: () => void;
    pruneInvalidTaskLinks: (validTaskIds: string[]) => void;

    /** Push the current state onto the undo stack (e.g. at drag start). */
    markHistory: () => void;
    undo: () => void;
    redo: () => void;

    // Workspace Actions (MVP Stubs)
    createMap: (title?: string) => string;
    switchMap: (id: string) => void;
    deleteMap: (id: string) => void;
    renameMap: (id: string, title: string) => void;

    // AI generation
    /** Build a brand-new workspace from an AI-generated tree and switch to it. */
    generateMapFromTree: (tree: AiTreeNode) => string;
    /** Append AI-suggested child nodes under an existing node (non-destructive). */
    expandNodeWithChildren: (parentId: string, ideas: AiChildIdea[]) => void;
    /**
     * Apply user-accepted "fix my mindmap" operations as ONE undo step.
     * Returns how many operations actually changed something — the live map
     * may have drifted since the AI reviewed it, and stale ops are skipped.
     */
    applyMapFixes: (operations: FixOperation[]) => number;
  };
}

export const ROOT_NODE_ID = "root";
const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };
const HISTORY_LIMIT = 50;
// Continuous typing into label/description fields writes per keystroke;
// snapshots within this window collapse into one undo step.
const HISTORY_COALESCE_MS = 1000;
const validCategories = new Set(["default", "goal", "task", "idea", "warning"]);
const validPriorities = new Set(["high", "medium", "low", "none"]);
const validStatuses = new Set(["todo", "doing", "done", "none"]);

const nowIso = () => new Date().toISOString();

/**
 * Validates a workspace structure to prevent runtime crashes from corrupted
 * storage. Returns a cleaned copy; never mutates the input.
 */
const validateWorkspace = (map: unknown): MindMapWorkspace | null => {
  if (!isRecord(map)) return null;
  if (typeof map.id !== "string" || !map.id) return null;
  if (typeof map.title !== "string") return null;
  if (!Array.isArray(map.nodes)) return null;
  if (!Array.isArray(map.edges)) return null;

  const now = nowIso();

  return {
    id: map.id,
    title: map.title.trim() || "Untitled Map",
    nodes: map.nodes as MindMapNode[],
    edges: map.edges as MindMapEdge[],
    viewport: sanitizeViewport(map.viewport),
    createdAt: sanitizeDate(map.createdAt, now),
    updatedAt: sanitizeDate(map.updatedAt, now),
  };
};

/**
 * Coalesces frequent store writes to prevent localStorage thrashing while
 * guaranteeing durability:
 * - pending writes flush on tab hide/close, so a refresh mid-edit loses nothing
 * - getItem reads your own pending write, so a rehydrate inside the debounce
 *   window can never revert local edits
 */
const createDebouncedStorage = (storage: Storage, wait = 500) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let pendingValue: string | null = null;
  let pendingKey: string | null = null;

  const flush = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    if (pendingKey !== null && pendingValue !== null) {
      try {
        storage.setItem(pendingKey, pendingValue);
      } catch (error) {
        console.error("[Jorata] Persistence failed:", error);
      }
      pendingKey = null;
      pendingValue = null;
    }
  };

  window.addEventListener("beforeunload", flush);
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });

  return {
    getItem: (name: string) =>
      pendingKey === name && pendingValue !== null ? pendingValue : storage.getItem(name),
    removeItem: (name: string) => {
      if (pendingKey === name) {
        pendingKey = null;
        pendingValue = null;
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
      }
      storage.removeItem(name);
    },
    setItem: (name: string, value: string) => {
      pendingKey = name;
      pendingValue = value;

      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(flush, wait);
    },
  };
};

const createRootNode = (): MindMapNode => {
  const now = nowIso();

  return {
    id: ROOT_NODE_ID,
    type: "editable",
    position: { x: 0, y: 0 },
    selected: false,
    data: {
      label: "Your idea starts here",
      category: "default",
      priority: "none",
      status: "none",
      isRoot: true,
      linkedTaskIds: [],
      linkedKpiIds: [],
      tags: [],
      createdAt: now,
      updatedAt: now,
    },
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sanitizeString = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim().length > 0 ? value : fallback;

const sanitizeStringArray = (value: unknown) =>
  Array.isArray(value)
    ? Array.from(
        new Set(
          value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        )
      )
    : [];

const sanitizeDate = (value: unknown, fallback: string) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : fallback;

const sanitizePosition = (value: unknown) => {
  if (!isRecord(value)) return { x: 0, y: 0 };

  return {
    x: typeof value.x === "number" && Number.isFinite(value.x) ? value.x : 0,
    y: typeof value.y === "number" && Number.isFinite(value.y) ? value.y : 0,
  };
};

const sanitizeNodeData = (value: unknown, id: string): MindMapNodeData => {
  const data = isRecord(value) ? value : {};
  const now = nowIso();
  const isRoot = id === ROOT_NODE_ID || data.isRoot === true;
  const category = sanitizeString(data.category, "default");
  const priority = sanitizeString(data.priority, "none");
  const status = sanitizeString(data.status, "none");

  // Optional AI note: keep only a real non-empty string (bounded), drop anything else.
  const aiDescription =
    typeof data.aiDescription === "string" && data.aiDescription.trim().length > 0
      ? data.aiDescription.trim().slice(0, 200)
      : undefined;

  return {
    ...data,
    label: sanitizeString(data.label, isRoot ? "Your idea starts here" : "Untitled Idea"),
    aiDescription,
    category: validCategories.has(category) ? (category as MindMapNodeData["category"]) : "default",
    priority: validPriorities.has(priority) ? (priority as MindMapNodeData["priority"]) : "none",
    status: validStatuses.has(status) ? (status as MindMapNodeData["status"]) : "none",
    isRoot,
    isNew: false,
    collapsed: data.collapsed === true,
    linkedTaskIds: sanitizeStringArray(data.linkedTaskIds),
    linkedKpiIds: sanitizeStringArray(data.linkedKpiIds),
    tags: sanitizeStringArray(data.tags),
    createdAt: sanitizeDate(data.createdAt, now),
    updatedAt: sanitizeDate(data.updatedAt, now),
  };
};

const sanitizeViewport = (value: unknown): Viewport => {
  if (!isRecord(value)) return DEFAULT_VIEWPORT;

  return {
    x: typeof value.x === "number" && Number.isFinite(value.x) ? value.x : DEFAULT_VIEWPORT.x,
    y: typeof value.y === "number" && Number.isFinite(value.y) ? value.y : DEFAULT_VIEWPORT.y,
    zoom:
      typeof value.zoom === "number" && Number.isFinite(value.zoom)
        ? Math.min(Math.max(value.zoom, 0.1), 4)
        : DEFAULT_VIEWPORT.zoom,
  };
};

const getEdgeId = (edge: Pick<MindMapEdge, "id" | "source" | "target" | "sourceHandle" | "targetHandle">) =>
  edge.id ||
  `edge-${edge.source}-${edge.sourceHandle ?? "source"}-${edge.target}-${edge.targetHandle ?? "target"}`;

// Sanitization runs at the persistence boundary (load + save), NOT on every
// change. onNodesChange fires on every drag frame — recreating node data
// there forces all nodes to re-render constantly.
const sanitizeNodes = (nodes: unknown, resetSelection = false): MindMapNode[] => {
  const nodeList = Array.isArray(nodes) ? nodes : [];
  const sanitized = nodeList
    .filter(isRecord)
    .map((node) => {
      const id = sanitizeString(node.id, crypto.randomUUID());

      return {
        ...node,
        id,
        type: typeof node.type === "string" ? node.type : "editable",
        position: sanitizePosition(node.position),
        selected: resetSelection ? false : node.selected === true,
        data: sanitizeNodeData(node.data, id),
      } as MindMapNode;
    });

  const hasRoot = sanitized.some((node) => node.id === ROOT_NODE_ID);
  return hasRoot ? sanitized : [createRootNode(), ...sanitized];
};

const sanitizeEdges = (edges: unknown, nodes?: MindMapNode[]) => {
  const edgeList = Array.isArray(edges) ? edges : [];
  const validNodeIds = nodes ? new Set(nodes.map((node) => node.id)) : null;
  const seen = new Set<string>();

  return edgeList
    .filter(isRecord)
    .filter((edge) => {
      const source = typeof edge.source === "string" ? edge.source : "";
      const target = typeof edge.target === "string" ? edge.target : "";

      return (
        source.length > 0 &&
        target.length > 0 &&
        source !== target &&
        (!validNodeIds || (validNodeIds.has(source) && validNodeIds.has(target)))
      );
    })
    .map((edge) => {
      // Strip per-edge styling — globals.css owns edge appearance, which also
      // normalizes edges persisted before this convention existed.
      const next = {
        ...(edge as MindMapEdge),
        id: getEdgeId(edge as MindMapEdge),
        source: edge.source as string,
        target: edge.target as string,
      };
      delete next.style;
      delete next.animated;
      return next;
    })
    .filter((edge) => {
      if (seen.has(edge.id)) return false;
      seen.add(edge.id);
      return true;
    }) as MindMapEdge[];
};

const pruneTaskLinks = (nodes: MindMapNode[], validTaskIds: Set<string>) =>
  nodes.map((node) => {
    const linkedTaskIds = node.data.linkedTaskIds.filter((taskId) => validTaskIds.has(taskId));
    if (linkedTaskIds.length === node.data.linkedTaskIds.length) return node;

    return {
      ...node,
      data: {
        ...node.data,
        linkedTaskIds,
        category: linkedTaskIds.length > 0 ? node.data.category : "default",
        status: linkedTaskIds.length > 0 ? node.data.status : "none",
        updatedAt: nowIso(),
      },
    };
  });

export const useMindMapStore = create<MindMapState>()(
  persist(
    (set, get) => {
      let lastSnapshotAt = 0;

      /**
       * Push the current nodes/edges onto the undo stack and clear redo.
       * Entries hold references to the (immutable) arrays, so this is cheap.
       */
      const takeSnapshot = (coalesce = false) => {
        const now = Date.now();
        if (coalesce && now - lastSnapshotAt < HISTORY_COALESCE_MS) {
          lastSnapshotAt = now;
          return;
        }
        lastSnapshotAt = now;
        set((state) => {
          // Skip exact duplicates (e.g. node + selection drag-start both firing).
          const last = state.past[state.past.length - 1];
          if (last && last.nodes === state.nodes && last.edges === state.edges) {
            return state;
          }

          return {
            past: [
              ...state.past.slice(-(HISTORY_LIMIT - 1)),
              { nodes: state.nodes, edges: state.edges },
            ],
            future: [],
          };
        });
      };

      const restore = (entry: HistoryEntry, state: MindMapState) => {
        const selectedNodeId =
          state.selectedNodeId && entry.nodes.some((n) => n.id === state.selectedNodeId)
            ? state.selectedNodeId
            : null;

        return {
          nodes: entry.nodes.map((node) => {
            const selected = node.id === selectedNodeId;
            return node.selected === selected ? node : { ...node, selected };
          }),
          edges: entry.edges,
          selectedNodeId,
          sidebarOpen: selectedNodeId ? state.sidebarOpen : false,
        };
      };

      return {
      maps: {},
      activeMapId: "",
      nodes: [createRootNode()],
      edges: [],
      viewport: DEFAULT_VIEWPORT,
      selectedNodeId: null,
      sidebarOpen: false,
      pendingFocusNodeId: null,
      past: [],
      future: [],

      actions: {
        setNodes: (nodes) => set((state) => {
          const nextNodes = sanitizeNodes(
            typeof nodes === "function" ? nodes(state.nodes) : nodes
          );

          return {
            nodes: nextNodes,
            edges: sanitizeEdges(state.edges, nextNodes),
          };
        }),
        setEdges: (edges) => set((state) => ({
          edges: sanitizeEdges(typeof edges === "function" ? edges(state.edges) : edges, state.nodes)
        })),

        onNodesChange: (changes) => {
          const safeChanges = changes.filter(
            (change) => !(change.type === "remove" && change.id === ROOT_NODE_ID)
          );
          if (safeChanges.length === 0) return;

          // Deletions (Delete/Backspace) come through as changes — they are
          // user intent and must be undoable. Drags snapshot at drag start.
          if (safeChanges.some((change) => change.type === "remove")) {
            takeSnapshot();
          }

          set((state) => {
          const nextNodes = applyNodeChanges(safeChanges, state.nodes) as MindMapNode[];

          let nextSelectedNodeId = state.selectedNodeId;
          const removedIds = new Set<string>();

          for (const change of safeChanges) {
            if (change.type === "select") {
              if (change.selected) {
                nextSelectedNodeId = change.id;
              } else if (nextSelectedNodeId === change.id) {
                nextSelectedNodeId = null;
              }
            } else if (change.type === "remove") {
              removedIds.add(change.id);
              if (nextSelectedNodeId === change.id) {
                nextSelectedNodeId = null;
              }
            }
          }

          return {
            nodes: nextNodes,
            edges: removedIds.size > 0
              ? state.edges.filter(
                  (edge) => !removedIds.has(edge.source) && !removedIds.has(edge.target)
                )
              : state.edges,
            selectedNodeId: nextSelectedNodeId,
          };
          });
        },

        onEdgesChange: (changes) => {
          if (changes.some((change) => change.type === "remove")) {
            takeSnapshot();
          }

          set((state) => ({
            edges: applyEdgeChanges(changes, state.edges) as MindMapEdge[],
          }));
        },

        onConnect: (connection: Connection) => {
          if (!connection.source || !connection.target) return;

          takeSnapshot();
          set((state) => ({
            edges: sanitizeEdges(MindMapService.connect(connection, state.edges) as MindMapEdge[], state.nodes)
          }));
        },

        onViewportChange: (viewport) => set({ viewport: sanitizeViewport(viewport) }),

        resetViewport: () => set({ viewport: DEFAULT_VIEWPORT }),

        selectNode: (id) => set((state) => ({
          selectedNodeId: id,
          nodes: state.nodes.map((node) => {
            const selected = id !== null && node.id === id;
            return node.selected === selected ? node : { ...node, selected };
          }),
        })),

        requestNodeFocus: (id) => {
          get().actions.selectNode(id);
          set({ pendingFocusNodeId: id });
        },

        clearNodeFocus: () => set({ pendingFocusNodeId: null }),

        openInspector: (id) => {
          if (id) get().actions.selectNode(id);
          set({ sidebarOpen: true });
        },

        toggleSidebar: (open) => set((state) => ({ sidebarOpen: open ?? !state.sidebarOpen })),

        updateNodeLabel: (id, label) => {
          takeSnapshot(true);
          set((state) => {
            const now = nowIso();

            return {
              nodes: state.nodes.map((node) =>
                node.id === id
                  ? { ...node, data: { ...node.data, label, updatedAt: now } }
                  : node
              ),
            };
          });
        },

        updateNodeData: (id, updates) => {
          // `isNew` is a transient editing trigger, not user content.
          const keys = Object.keys(updates);
          const isTransientOnly = keys.length === 1 && keys[0] === "isNew";
          if (!isTransientOnly) {
            takeSnapshot(true);
          }

          set((state) => {
            const now = nowIso();

            return {
              nodes: state.nodes.map((node) =>
                node.id === id
                  ? { ...node, data: { ...node.data, ...updates, updatedAt: now } }
                  : node
              ),
            };
          });
        },

        addNode: (label, parentId, position, type = "editable") => {
          const current = get();
          const parentNode = parentId
            ? current.nodes.find((node) => node.id === parentId)
            : undefined;
          const siblingIndex = parentNode
            ? current.edges.filter((edge) => edge.source === parentNode.id).length
            : 0;
          const newNode = MindMapService.createNode(label, parentNode, position, siblingIndex, type);

          useActivityStore.getState().actions.logActivity(
            'node_created',
            type === "sticky"
              ? `Added sticky note: ${newNode.data.label}`
              : `Added mind map node: ${newNode.data.label}`,
            { nodeId: newNode.id, parentId, mapId: current.activeMapId }
          );

          takeSnapshot();
          set((state) => ({
            nodes: [
              ...state.nodes.map((node) => (node.selected ? { ...node, selected: false } : node)),
              { ...newNode, selected: true },
            ],
            edges: parentNode && type === "editable"
              ? [...state.edges, MindMapService.createEdge(parentNode.id, newNode.id)]
              : state.edges,
            selectedNodeId: newNode.id,
          }));
          return newNode;
        },

        beginEditing: (id) => set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === id ? { ...node, data: { ...node.data, isNew: true } } : node
          ),
        })),

        toggleNodeCollapse: (id) => {
          takeSnapshot();
          set((state) => ({
            nodes: state.nodes.map((node) =>
              node.id === id
                ? { ...node, data: { ...node.data, collapsed: !node.data.collapsed } }
                : node
            ),
          }));
        },

        removeNode: (id) => {
          if (id === ROOT_NODE_ID) return;

          takeSnapshot();
          set((state) => ({
            nodes: state.nodes.filter((node) => node.id !== id),
            edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
            selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
          }));
        },

        duplicateNode: (id) => {
          const node = get().nodes.find((n) => n.id === id);
          if (!node) return;
          const newNode = MindMapService.duplicateNode(node);
          takeSnapshot();
          set((state) => ({
            nodes: [
              ...state.nodes.map((n) => (n.selected ? { ...n, selected: false } : n)),
              { ...newNode, selected: true },
            ],
            selectedNodeId: newNode.id,
          }));
        },

        tidyMap: () => {
          takeSnapshot();
          set((state) => ({
            nodes: calculateTreeLayout(state.nodes, state.edges)
          }));
        },

        convertNodeToTask: (id) => {
          const node = get().nodes.find((n) => n.id === id);
          if (!node || node.data.isRoot || node.data.linkedTaskIds.length > 0) return;

          const label = node.data.label.trim() || "Untitled Task";
          const task = useTaskStore.getState().actions.addTask(
            label,
            node.data.priority !== "none" ? node.data.priority : "medium",
            "quick", // default energy
            node.data.category !== "default" ? node.data.category : "Mind Map"
          );

          // Back-reference so the task can jump to its origin node, across maps.
          useTaskStore.getState().actions.updateTask(task.id, {
            sourceNodeId: id,
            sourceMapId: get().activeMapId,
          });

          useActivityStore.getState().actions.logActivity(
            'node_converted',
            `Converted node to task: ${label}`,
            { nodeId: id, taskId: task.id, mapId: get().activeMapId }
          );

          takeSnapshot();
          set((state) => ({
            nodes: state.nodes.map((n) =>
              n.id === id
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      category: "task",
                      status: "todo",
                      linkedTaskIds: [task.id],
                      updatedAt: nowIso(),
                    },
                  }
                : n
            ),
          }));
        },

        pruneInvalidTaskLinks: (validTaskIds) => set((state) => {
          const validTaskIdSet = new Set(validTaskIds);
          const nodes = pruneTaskLinks(state.nodes, validTaskIdSet);
          const changed = nodes.some((node, index) => node !== state.nodes[index]);

          return changed ? { nodes } : state;
        }),

        markHistory: () => takeSnapshot(),

        undo: () => set((state) => {
          const entry = state.past[state.past.length - 1];
          if (!entry) return state;

          return {
            ...restore(entry, state),
            past: state.past.slice(0, -1),
            future: [
              ...state.future.slice(-(HISTORY_LIMIT - 1)),
              { nodes: state.nodes, edges: state.edges },
            ],
          };
        }),

        redo: () => set((state) => {
          const entry = state.future[state.future.length - 1];
          if (!entry) return state;

          return {
            ...restore(entry, state),
            future: state.future.slice(0, -1),
            past: [
              ...state.past.slice(-(HISTORY_LIMIT - 1)),
              { nodes: state.nodes, edges: state.edges },
            ],
          };
        }),

        createMap: (title) => {
          const id = crypto.randomUUID();
          const now = nowIso();

          // Default titles stay distinguishable: "Mind Map 2", "Mind Map 3"…
          // (a list of identical "New Mindmap"s is unnavigable).
          let fallbackTitle = "";
          if (!title) {
            const existingTitles = new Set(Object.values(get().maps).map((map) => map.title));
            let n = Object.keys(get().maps).length + 1;
            while (existingTitles.has(`Mind Map ${n}`)) n += 1;
            fallbackTitle = `Mind Map ${n}`;
          }

          const newMap: MindMapWorkspace = {
            id,
            title: title || fallbackTitle,
            nodes: [createRootNode()],
            edges: [],
            viewport: DEFAULT_VIEWPORT,
            createdAt: now,
            updatedAt: now,
          };

          set((state) => ({
            maps: { ...state.maps, [id]: newMap }
          }));

          get().actions.switchMap(id);
          return id;
        },

        switchMap: (id) => {
          set((state) => {
            const nextMap = state.maps[id];
            
            if (!nextMap) {
               if (process.env.NODE_ENV === 'development') {
                 console.error(`[Jorata] Failed to switch: Map ${id} not found.`);
               }
               return state;
            }

            const updatedMaps = { ...state.maps };
            
            // 1. Commit current state to its workspace entry
            if (state.activeMapId && updatedMaps[state.activeMapId]) {
              updatedMaps[state.activeMapId] = {
                ...updatedMaps[state.activeMapId],
                nodes: state.nodes,
                edges: state.edges,
                viewport: state.viewport,
                updatedAt: nowIso(),
              };
            }

            if (process.env.NODE_ENV === 'development') {
              console.log(`[Jorata] Switching to workspace: ${nextMap.title} (${id})`);
            }

            // 2. Load target data and finalize ID
            return {
              maps: updatedMaps,
              activeMapId: id,
              nodes: sanitizeNodes(nextMap.nodes, true),
              edges: sanitizeEdges(nextMap.edges, nextMap.nodes),
              viewport: sanitizeViewport(nextMap.viewport),
              selectedNodeId: null,
              pendingFocusNodeId: null,
              past: [],
              future: [],
            };
          });
        },

        deleteMap: (id) => {
          set((state) => {
            const { [id]: deleted, ...remainingMaps } = state.maps;
            void deleted;

            // Don't delete the last map
            if (Object.keys(remainingMaps).length === 0) return state;

            let nextActiveId = state.activeMapId;
            let nextNodes = state.nodes;
            let nextEdges = state.edges;
            let nextViewport = state.viewport;

            if (state.activeMapId === id) {
              nextActiveId = Object.keys(remainingMaps)[0];
              const nextMap = remainingMaps[nextActiveId];
              nextNodes = sanitizeNodes(nextMap.nodes, true);
              nextEdges = sanitizeEdges(nextMap.edges, nextNodes);
              nextViewport = sanitizeViewport(nextMap.viewport);
            }

            return {
              maps: remainingMaps,
              activeMapId: nextActiveId,
              nodes: nextNodes,
              edges: nextEdges,
              viewport: nextViewport,
              selectedNodeId: null,
              pendingFocusNodeId: null,
              past: [],
              future: [],
            };
          });
        },

        renameMap: (id, title) => {
          set((state) => {
            if (!state.maps[id]) return state;
            return {
              maps: {
                ...state.maps,
                [id]: { ...state.maps[id], title, updatedAt: nowIso() }
              }
            };
          });
        },

        generateMapFromTree: (tree) => {
          // JSON → flow → balanced positions, all via existing utilities.
          const { nodes, edges } = mindMapTreeToFlow(tree);
          const laidOut = calculateTreeLayout(nodes, edges);
          const id = crypto.randomUUID();
          const now = nowIso();

          set((state) => ({
            maps: {
              ...state.maps,
              [id]: {
                id,
                title: tree.title || "Generated Map",
                nodes: laidOut,
                edges,
                viewport: DEFAULT_VIEWPORT,
                createdAt: now,
                updatedAt: now,
              },
            },
          }));

          // Reuse switchMap: commits the current map, loads + sanitizes the new
          // one, and resets viewport/history so the canvas auto-fits it.
          get().actions.switchMap(id);
          return id;
        },

        expandNodeWithChildren: (parentId, ideas) => {
          const state = get();
          const parent = state.nodes.find((n) => n.id === parentId);
          if (!parent || ideas.length === 0) return;

          // Continue fanning out from where this node's existing children stop,
          // so AI suggestions don't land on top of manually-added ones.
          const existingChildCount = state.edges.filter((e) => e.source === parentId).length;

          const newNodes: MindMapNode[] = [];
          const newEdges: MindMapEdge[] = [];
          ideas.forEach((idea, index) => {
            const node = MindMapService.createNode(
              idea.title,
              parent,
              undefined,
              existingChildCount + index
            );
            // Generated nodes must not pop into edit mode the way a single
            // hand-added node does.
            node.data.isNew = false;
            if (idea.category && validCategories.has(idea.category)) {
              node.data.category = idea.category;
            }
            if (idea.description) {
              node.data.aiDescription = idea.description;
            }
            newNodes.push(node);
            newEdges.push(MindMapService.createEdge(parent.id, node.id));
          });

          useActivityStore.getState().actions.logActivity(
            "node_created",
            `AI expanded "${parent.data.label}" with ${newNodes.length} ideas`,
            { nodeId: parentId, mapId: state.activeMapId }
          );

          takeSnapshot();
          set((s) => ({
            nodes: [
              ...s.nodes.map((n) => (n.selected ? { ...n, selected: false } : n)),
              ...newNodes,
            ],
            edges: [...s.edges, ...newEdges],
          }));
        },

        applyMapFixes: (operations) => {
          const state = get();
          const result = applyFixOperations(
            state.nodes,
            state.edges,
            operations,
            ROOT_NODE_ID
          );
          if (result.applied === 0) return 0;

          // One snapshot for the whole batch → a single Ctrl+Z reverts it all.
          takeSnapshot();
          set((s) => ({
            nodes: result.nodes,
            edges: sanitizeEdges(result.edges, result.nodes),
            selectedNodeId:
              s.selectedNodeId && result.nodes.some((n) => n.id === s.selectedNodeId)
                ? s.selectedNodeId
                : null,
          }));
          return result.applied;
        },
      }
      };
    },
    {
      name: "jmind:mindmap",
      storage: typeof window !== "undefined" 
        ? createJSONStorage(() => createDebouncedStorage(window.localStorage)) 
        : undefined,
      partialize: (state) => {
        // Sync top-level active state into the maps record before persisting.
        const activeMap = state.maps[state.activeMapId];
        if (!activeMap) return { maps: state.maps, activeMapId: state.activeMapId };

        const maps = {
          ...state.maps,
          [state.activeMapId]: {
            ...activeMap,
            nodes: state.nodes,
            edges: state.edges,
            viewport: state.viewport,
            // updatedAt should NOT be here — it causes infinite loops during cross-tab sync!
          }
        };

        return { maps, activeMapId: state.activeMapId };
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          // Without this handler zustand swallows hydration errors and the
          // store silently runs on defaults — which would then persist over
          // the user's real data. Log loudly and let the workspace guard
          // below rebuild a safe state.
          console.error("[Jorata] Mindmap hydration failed:", error);
        }
        // Covers every path that can leave the store without a workspace:
        // brand-new user (nothing persisted → merge never runs), corrupted
        // storage, or a hydration error.
        queueMicrotask(() => ensureWorkspaceExists());
      },
      merge: (persisted, current) => {
        if (!persisted) return current;
        // Covers both the current shape ({maps, activeMapId}) and the legacy
        // single-map shape ({nodes, edges, viewport}) for migration.
        const saved = persisted as Partial<MindMapState> & {
          maps?: Record<string, unknown>;
        };

        // 1. Migration Logic
        const rawMaps = saved.maps || {};
        const maps: Record<string, MindMapWorkspace> = {};

        // Validate and clean each workspace during rehydration
        Object.entries(rawMaps).forEach(([id, map]) => {
          const validated = validateWorkspace(map);
          if (validated) maps[id] = validated;
        });

        // Prefer current active ID if it exists (allows independent tab views), 
        // fallback to saved last-used map for new tabs.
        let activeMapId = current.activeMapId || saved.activeMapId || "";
        
        const hasLegacyData = Array.isArray(saved.nodes) && saved.nodes.length > 0;
        const hasMaps = Object.keys(maps).length > 0;

        if (!hasMaps && hasLegacyData) {
          if (process.env.NODE_ENV === 'development') {
            console.log("[Jorata] Migrating legacy mindmap data to workspace system...");
          }
          const legacyId = crypto.randomUUID();
          const now = nowIso();
          maps[legacyId] = {
            id: legacyId,
            title: "My First Mindmap",
            nodes: sanitizeNodes(saved.nodes, true),
            edges: sanitizeEdges(saved.edges, saved.nodes),
            viewport: sanitizeViewport(saved.viewport),
            createdAt: now,
            updatedAt: now
          };
          activeMapId = legacyId;
        }

        // 2. Safe Rehydration: Ensure we have at least one valid map and an activeMapId.
        if (Object.keys(maps).length === 0) {
          const defaultId = crypto.randomUUID();
          const now = nowIso();
          maps[defaultId] = {
            id: defaultId,
            title: "My Mindmap",
            nodes: [createRootNode()],
            edges: [],
            viewport: DEFAULT_VIEWPORT,
            createdAt: now,
            updatedAt: now
          };
          activeMapId = defaultId;
        }

        if (!activeMapId || !maps[activeMapId]) {
          activeMapId = Object.keys(maps)[0];
        }

        const activeMap = maps[activeMapId];
        const nodes = sanitizeNodes(activeMap.nodes, true);

        // Keep local UI state (selection/panel) intact during rehydrates.
        const selectedNodeId =
          current.selectedNodeId && nodes.some((node) => node.id === current.selectedNodeId)
            ? current.selectedNodeId
            : null;

        return {
          ...current,
          maps,
          activeMapId,
          nodes: selectedNodeId
            ? nodes.map((node) => (node.id === selectedNodeId ? { ...node, selected: true } : node))
            : nodes,
          edges: sanitizeEdges(activeMap.edges, nodes),
          viewport:
            current.viewport === DEFAULT_VIEWPORT
              ? sanitizeViewport(activeMap.viewport)
              : current.viewport,
          selectedNodeId,
          sidebarOpen: selectedNodeId ? current.sidebarOpen : false,
          past: current.past,
          future: current.future,
          actions: current.actions,
        };
      },
    }
  )
);

/**
 * Post-hydration safety net: the store must never run without an active
 * workspace. Adopts whatever top-level nodes/edges exist (e.g. defaults, or
 * survivors of a failed hydration) into a fresh workspace entry.
 */
function ensureWorkspaceExists() {
  const state = useMindMapStore.getState();
  if (state.activeMapId && state.maps[state.activeMapId]) return;

  const id = crypto.randomUUID();
  const now = nowIso();

  useMindMapStore.setState({
    maps: {
      ...state.maps,
      [id]: {
        id,
        title: "My Mindmap",
        nodes: state.nodes,
        edges: state.edges,
        viewport: state.viewport,
        createdAt: now,
        updatedAt: now,
      },
    },
    activeMapId: id,
  });
}

export const useMindMapActions = () => useMindMapStore((state) => state.actions);
export const useMindMapNodes = () => useMindMapStore((state) => state.nodes);
export const useMindMapEdges = () => useMindMapStore((state) => state.edges);
export const useMindMapViewport = () => useMindMapStore((state) => state.viewport);
export const useCanUndo = () => useMindMapStore((state) => state.past.length > 0);
export const useCanRedo = () => useMindMapStore((state) => state.future.length > 0);
export const useSelectedNode = () => {
  const nodes = useMindMapStore((state) => state.nodes);
  const id = useMindMapStore((state) => state.selectedNodeId);
  return nodes.find(n => n.id === id) || null;
};

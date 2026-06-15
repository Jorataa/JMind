"use client";

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import EditableNode from "./EditableNode";
import StickyNode from "./StickyNode";
import NodeContextMenu from "./components/NodeContextMenu";
import PaneContextMenu from "./components/PaneContextMenu";
import NodeIntelligenceSidebar from "./components/NodeIntelligenceSidebar";
import CanvasToolbar from "./components/CanvasToolbar";
import CanvasHelp from "./components/CanvasHelp";
import AiChat from "@/features/ai/AiChat";
import AiButton from "@/components/ui/AiButton";

import {
  useMindMapNodes,
  useMindMapEdges,
  useMindMapActions,
  useMindMapViewport,
  useMindMapStore,
  ROOT_NODE_ID,
  MindMapNode,
} from "@/stores/use-mindmap-store";
import { useTaskStore } from "@/stores/use-task-store";
import { useToast } from "@/stores/use-toast-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { getHiddenNodeIds } from "@/lib/collapse";
import { AnimatePresence, motion } from "framer-motion";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

// ─── Constants ────────────────────────────────────────────────────────────────

const nodeTypes: NodeTypes = {
  editable: EditableNode,
  sticky: StickyNode,
};

// Roughly half a default node, so double-clicked nodes center on the cursor.
const NODE_CENTER_OFFSET = { x: 80, y: 20 };
// Half a sticky note (180×180), so stickies center on their drop point.
const STICKY_CENTER_OFFSET = { x: 90, y: 90 };

type CanvasMenu =
  | { kind: "node"; id: string; x: number; y: number }
  | { kind: "pane"; x: number; y: number; flowX: number; flowY: number };

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable);

const isCanvasTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  Boolean(target.closest(".react-flow__node, .react-flow__pane"));

// ─── MindMapCanvas Internals ──────────────────────────────────────────────────

function MindMapFlow() {
  const nodes = useMindMapNodes();
  const edges = useMindMapEdges();
  const viewport = useMindMapViewport();
  const selectedNodeId = useMindMapStore((state) => state.selectedNodeId);

  // Collapse/expand: descendants of a collapsed node are hidden. Derived at
  // render (only `collapsed` is persisted) and kept referentially stable so
  // React Flow's memoization isn't defeated when nothing changed.
  const hiddenNodeIds = useMemo(() => getHiddenNodeIds(nodes, edges), [nodes, edges]);
  const displayNodes = useMemo(
    () =>
      nodes.map((n) => {
        const hide = hiddenNodeIds.has(n.id);
        return (n.hidden ?? false) === hide ? n : { ...n, hidden: hide };
      }),
    [nodes, hiddenNodeIds]
  );
  const displayEdges = useMemo(
    () =>
      edges.map((e) => {
        const hide = hiddenNodeIds.has(e.target) || hiddenNodeIds.has(e.source);
        return (e.hidden ?? false) === hide ? e : { ...e, hidden: hide };
      }),
    [edges, hiddenNodeIds]
  );
  const {
    onNodesChange,
    onEdgesChange,
    onConnect,
    onViewportChange,
    selectNode,
    clearNodeFocus,
    beginEditing,
    addNode,
    tidyMap,
    toggleSidebar,
    markHistory,
    undo,
    redo,
  } = useMindMapActions();
  const { fitView, setCenter, screenToFlowPosition } = useReactFlow();

  // Map switches remount ReactFlow (keyed below), so `defaultViewport` always
  // reflects the incoming map. A map still on the untouched default viewport
  // (first visit / freshly created) gets framed with fitView instead of
  // showing its root pinned to the top-left corner; a saved viewport wins.
  // Arriving with a selection skips the fit — the center effect takes over.
  const activeMapId = useMindMapStore((state) => state.activeMapId);
  const shouldFitView =
    !selectedNodeId && viewport.x === 0 && viewport.y === 0 && viewport.zoom === 1;

  // Mirror linked task completion into node status. One subscription for the
  // lifetime of the canvas; reads fresh store state inside the callback.
  useEffect(() => {
    return useTaskStore.subscribe((state, prevState) => {
      if (state.tasks === prevState.tasks) return;

      const { nodes: currentNodes, actions } = useMindMapStore.getState();

      state.tasks.forEach((task) => {
        const prevTask = prevState.tasks.find((t) => t.id === task.id);
        if (!prevTask || prevTask.completed === task.completed) return;

        currentNodes.forEach((node) => {
          if (node.data.linkedTaskIds?.includes(task.id)) {
            const nextStatus = task.completed ? "done" : "todo";
            if (node.data.status !== nextStatus) {
              actions.updateNodeData(node.id, { status: nextStatus });
            }
          }
        });
      });
    });
  }, []);

  // Focus requests (palette jumps, cross-map search) → frame the node.
  const pendingFocusNodeId = useMindMapStore((state) => state.pendingFocusNodeId);
  useEffect(() => {
    if (!pendingFocusNodeId) return;

    const node = useMindMapStore.getState().nodes.find((n) => n.id === pendingFocusNodeId);
    if (!node) {
      clearNodeFocus();
      return;
    }

    // The keyed <ReactFlow> below may have just remounted on a map switch —
    // give it a beat to mount and measure before animating. The request is
    // cleared inside the timeout so this effect's own cleanup (triggered by
    // that state change) can't cancel the timer before it fires.
    const timer = window.setTimeout(() => {
      setCenter(node.position.x + NODE_CENTER_OFFSET.x, node.position.y + NODE_CENTER_OFFSET.y, {
        zoom: 1.1,
        duration: 500,
      });
      clearNodeFocus();
    }, 80);
    return () => window.clearTimeout(timer);
  }, [pendingFocusNodeId, clearNodeFocus, setCenter]);

  const [menu, setMenu] = useState<CanvasMenu | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  // Node titles feed the AI's "Update with Latest Info" — empty placeholders
  // and the root's default app name aren't useful topics, so drop them.
  const aiNodeTitles = useMemo(
    () =>
      nodes
        .filter((n) => !n.data.isRoot)
        .map((n) => n.data.label.trim())
        .filter((label) => label.length > 0),
    [nodes]
  );

  const handleTidy = useCallback(() => {
    tidyMap();
    // Let React Flow pick up the new positions before framing them.
    window.setTimeout(() => fitView({ duration: 400, padding: 0.2 }), 50);
  }, [tidyMap, fitView]);

  const addToast = useToast();

  const addStickyAt = useCallback(
    (flowPosition: { x: number; y: number }) => {
      addNode(
        "New thought",
        undefined,
        { x: flowPosition.x - STICKY_CENTER_OFFSET.x, y: flowPosition.y - STICKY_CENTER_OFFSET.y },
        "sticky"
      );

      // First sticky ever: a quiet, one-time note so a free-floating card reads
      // as intentional rather than a missing connection.
      if (!localStorage.getItem("jmind:sticky-hint-seen")) {
        localStorage.setItem("jmind:sticky-hint-seen", "1");
        addToast("Sticky notes float freely — drag them anywhere.", "info");
      }
    },
    [addNode, addToast]
  );

  // Sticky notes drop at the visual center of the canvas (not the window —
  // the nav sidebar offsets those). screenToFlowPosition keeps this correct
  // at any zoom/pan without subscribing to the viewport.
  const addStickyAtCenter = useCallback(() => {
    const wrapper = document.getElementById("mindmap-canvas");
    const rect = wrapper?.getBoundingClientRect();
    const screenCenter = rect
      ? { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const position = screenToFlowPosition(screenCenter);

    // Center drops cascade like dealt cards — back-to-back S presses must
    // never stack into what reads as a single note.
    const stickyCount = useMindMapStore.getState().nodes.filter((n) => n.type === "sticky").length;
    const cascade = (stickyCount % 5) * 24;

    addStickyAt({ x: position.x + cascade, y: position.y + cascade });
  }, [addStickyAt, screenToFlowPosition]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        redo();
        return;
      }

      if (e.key === "Tab" && isCanvasTarget(e.target)) {
        // Tab grows the map (child of selection, or a new branch from root) —
        // outside the canvas it keeps its normal focus-navigation meaning.
        e.preventDefault();
        addNode("New Idea", selectedNodeId ?? ROOT_NODE_ID);
      } else if ((e.key === "s" || e.key === "S") && !mod && !e.altKey) {
        // Plain S only — Ctrl/Cmd+S keeps its browser meaning.
        e.preventDefault();
        addStickyAtCenter();
      } else if ((e.key === "Enter" || e.key === "F2") && selectedNodeId && isCanvasTarget(e.target)) {
        // F2 is the universal rename key; Enter is the keyboard-first path.
        e.preventDefault();
        beginEditing(selectedNodeId);
      } else if ((e.key === "f" || e.key === "F") && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        fitView({ duration: 300, padding: 0.2, maxZoom: 1.25 });
      } else if ((e.key === "i" || e.key === "I") && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        toggleSidebar();
      } else if (e.key === "T" && e.shiftKey) {
        e.preventDefault();
        handleTidy();
      } else if (e.key === "Escape") {
        setMenu(null);
        selectNode(null);
      }
    },
    [addNode, addStickyAtCenter, beginEditing, fitView, handleTidy, redo, selectNode, selectedNodeId, toggleSidebar, undo]
  );

  const onNodeContextMenu = useCallback(
    (event: MouseEvent, node: MindMapNode) => {
      event.preventDefault();
      setMenu({
        kind: "node",
        id: node.id,
        x: event.clientX,
        y: event.clientY,
      });
    },
    []
  );

  // Right-click on empty canvas → create at the cursor (the discoverable
  // counterpart to double-click and the S key).
  const onPaneContextMenu = useCallback(
    (event: MouseEvent | globalThis.MouseEvent) => {
      event.preventDefault();
      const flowPosition = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setMenu({
        kind: "pane",
        x: event.clientX,
        y: event.clientY,
        flowX: flowPosition.x,
        flowY: flowPosition.y,
      });
    },
    [screenToFlowPosition]
  );

  const handlePaneClick = useCallback(() => {
    setMenu(null);
    selectNode(null);
  }, [selectNode]);

  // Double-click on empty canvas → new idea right under the cursor.
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!(e.target instanceof HTMLElement) || !e.target.classList.contains("react-flow__pane")) {
        return;
      }

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addNode("New Idea", undefined, {
        x: position.x - NODE_CENTER_OFFSET.x,
        y: position.y - NODE_CENTER_OFFSET.y,
      });
    },
    [addNode, screenToFlowPosition]
  );

  return (
    <>
      <div
        className="relative h-full min-w-0 flex-1"
        onKeyDown={onKeyDown}
        onDoubleClick={handleDoubleClick}
      >
        {/* Keyed remount per map: ReactFlow re-reads defaultViewport for the
            incoming map. Enter-only fade — an exit phase would double the
            perceived switch time. */}
        <motion.div
          key={activeMapId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="h-full w-full"
        >
            <ReactFlow
              nodes={displayNodes}
              edges={displayEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onMoveEnd={(_, nextViewport) => onViewportChange(nextViewport)}
              defaultViewport={viewport}
              fitView={shouldFitView}
              fitViewOptions={{ padding: 0.4, maxZoom: 1.25 }}
              onNodeContextMenu={onNodeContextMenu}
              onNodeDoubleClick={(_, node) => beginEditing(node.id)}
              onPaneContextMenu={onPaneContextMenu}
              onPaneClick={handlePaneClick}
              onNodeDragStart={markHistory}
              onSelectionDragStart={markHistory}
              nodeTypes={nodeTypes}
              deleteKeyCode={["Backspace", "Delete"]}
              // 4px, not 1: a tiny wobble during a double-click must not be read
              // as a drag — that would swallow the dblclick and rename feels dead.
              nodeDragThreshold={4}
              zoomOnDoubleClick={false}
              snapToGrid
              snapGrid={[12, 12]}
              minZoom={0.1}
              maxZoom={4}
              // Hiding the attribution is a React Flow Pro feature per xyflow's
              // terms — enabled at the project owner's request.
              proOptions={{ hideAttribution: true }}
              className="bg-[#09090b]"
            >
              <CanvasToolbar onTidy={handleTidy} onAddSticky={addStickyAtCenter} />
              <CanvasHelp />

              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={0.6}
                color="rgba(255,255,255,0.05)"
              />

              {nodes.length > 4 && (
                <MiniMap
                  pannable
                  zoomable
                  nodeColor={(node) => {
                    if (node.type === "sticky") {
                      const stickyMiniColors: Record<string, string> = {
                        yellow: "#fde047",
                        blue: "#93c5fd",
                        green: "#86efac",
                        pink: "#f9a8d4",
                      };
                      return stickyMiniColors[(node.data?.color as string) ?? "yellow"] ?? "#fde047";
                    }
                    if (node.data?.isRoot) return "#10b981";
                    if (node.data?.category === "goal") return "#6366f1";
                    if (node.data?.category === "task") return "#10b981";
                    if (node.data?.category === "idea") return "#8b5cf6";
                    if (node.data?.category === "warning") return "#f43f5e";
                    return "#3f3f46";
                  }}
                  maskColor="rgba(0,0,0,0.6)"
                  className="!bg-zinc-950/40 !border-white/10 !rounded-2xl shadow-2xl backdrop-blur-md"
                  style={{ width: 140, height: 110 }}
                />
              )}

              <Controls
                showInteractive={false}
                className="!bg-zinc-900 !border-white/10 !rounded-xl !shadow-2xl overflow-hidden"
              />

              <AnimatePresence>
                {nodes.length <= 1 && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-16 z-0 flex justify-center">
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{ duration: 0.3 }}
                      className="flex select-none flex-col items-center gap-4 rounded-3xl border border-white/5 bg-zinc-900/60 p-6 backdrop-blur-xl shadow-2xl"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                        Quick Start
                      </p>
                      <div className="hidden items-center gap-6 sm:flex">
                        <EmptyHint keyName="2× Click" action="New idea" />
                        <span className="h-4 w-px bg-white/10" />
                        <EmptyHint keyName="Tab" action="Branch out" />
                        <span className="h-4 w-px bg-white/10" />
                        <EmptyHint keyName="S" action="Sticky note" />
                        <span className="h-4 w-px bg-white/10" />
                        <EmptyHint keyName="Enter" action="Rename" />
                      </div>
                      <p className="text-center text-[12px] font-medium text-zinc-400 sm:hidden">
                        Tap <span className="font-semibold text-emerald-400">+ Idea</span> to begin
                        <span className="mt-1 block text-zinc-500">double-tap a node to rename</span>
                      </p>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

            </ReactFlow>
        </motion.div>

        {/* Node details panel — overlays the canvas edge, opens on demand */}
        <NodeIntelligenceSidebar />

        {/* AI chat — floating launcher (top-right) + slide-in panel */}
        {!aiOpen && (
          <AiButton onClick={() => setAiOpen(true)} className="absolute right-4 top-4 z-20" />
        )}
        <AiChat mindMapNodes={aiNodeTitles} open={aiOpen} onClose={() => setAiOpen(false)} />
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {menu?.kind === "node" && (
          <NodeContextMenu
            id={menu.id}
            x={menu.x}
            y={menu.y}
            onClose={() => setMenu(null)}
          />
        )}
        {menu?.kind === "pane" && (
          <PaneContextMenu
            x={menu.x}
            y={menu.y}
            onAddIdea={() =>
              addNode("New Idea", undefined, {
                x: menu.flowX - NODE_CENTER_OFFSET.x,
                y: menu.flowY - NODE_CENTER_OFFSET.y,
              })
            }
            onAddSticky={() => addStickyAt({ x: menu.flowX, y: menu.flowY })}
            onFitView={() => fitView({ duration: 300, padding: 0.2, maxZoom: 1.25 })}
            onClose={() => setMenu(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function EmptyHint({ keyName, action }: { keyName: string; action: string }) {
  return (
    <div className="flex items-center gap-2">
      <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-bold text-zinc-400">
        {keyName}
      </kbd>
      <span className="text-[11px] font-medium text-zinc-500">{action}</span>
    </div>
  );
}

// ─── MindMapCanvas ────────────────────────────────────────────────────────────

export default function MindMapCanvas() {
  const isHydrated = useHydrated();

  if (!isHydrated) {
    return <div className="h-full w-full animate-pulse bg-[#09090b]" />;
  }

  return (
    <div id="mindmap-canvas" className="relative flex h-full w-full overflow-hidden bg-[#09090b]">
      <ErrorBoundary fallbackTitle="Visual Workspace Error">
        <ReactFlowProvider>
          <MindMapFlow />
        </ReactFlowProvider>
      </ErrorBoundary>
    </div>
  );
}

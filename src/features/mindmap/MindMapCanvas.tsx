"use client";

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  Background,
  BackgroundVariant,
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
import MapSwitcher from "./components/MapSwitcher";
import CanvasToolbar, { type WorkspaceView } from "./components/CanvasToolbar";
import { CanvasDock, ZoomPill, CanvasHints, type CanvasTool } from "./components/CanvasDock";
import OutlineView from "./components/OutlineView";
import CanvasHelp from "./components/CanvasHelp";
import ProposalBar from "./components/ProposalBar";
import { useAiGenerate, abortActiveAi } from "@/features/ai/useAiGenerate";
import { useUIActions } from "@/stores/use-ui-store";

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
import { BRANCH_COLOR_STYLES } from "@/lib/node-colors";
import { AnimatePresence, motion } from "framer-motion";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { cn } from "@/lib/cn";
import { Sparkles } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const nodeTypes: NodeTypes = {
  editable: EditableNode,
  sticky: StickyNode,
};

// Roughly half a default node, so double-clicked nodes center on the cursor.
const NODE_CENTER_OFFSET = { x: 80, y: 20 };
// Half a sticky note (190×150), so stickies center on their drop point.
const STICKY_CENTER_OFFSET = { x: 95, y: 75 };

// Sticky paper tints for the minimap (mirrors StickyNode's palette).
const STICKY_MINI_COLORS: Record<string, string> = {
  yellow: "#E9DDB4",
  blue: "#CFDAE2",
  green: "#D8E0CC",
  pink: "#E8D2C7",
};

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

function MindMapFlow({
  onOpenAi,
  view,
  onViewChange,
}: {
  onOpenAi: () => void;
  view: WorkspaceView;
  onViewChange: (view: WorkspaceView) => void;
}) {
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
  const [tool, setTool] = useState<CanvasTool>("select");
  const [connectFrom, setConnectFrom] = useState<string | null>(null);

  // Generation state (§5.1): one hook instance drives the invite, refine and
  // regenerate so the loading state is shared everywhere.
  const { generate, isLoading: generating } = useAiGenerate();
  const [lastTopic, setLastTopic] = useState<string | null>(null);
  const [refineOpen, setRefineOpen] = useState(false);
  const proposedCount = useMemo(
    () => nodes.reduce((count, n) => (n.data.proposed ? count + 1 : count), 0),
    [nodes]
  );

  const runGenerate = useCallback(
    async (topic: string, intoActiveMap: boolean) => {
      const ok = await generate(
        topic,
        intoActiveMap ? { intoMapId: useMindMapStore.getState().activeMapId } : undefined
      );
      if (ok) {
        setLastTopic(topic);
        setRefineOpen(false);
      }
      return ok;
    },
    [generate]
  );

  // The node toolbar's ⋯ verb asks the canvas to open the full context menu.
  useEffect(() => {
    const onNodeMenu = (e: Event) => {
      const { id, x, y } = (e as CustomEvent<{ id: string; x: number; y: number }>).detail;
      setMenu({ kind: "node", id, x, y });
    };
    window.addEventListener("jorata:node-menu", onNodeMenu);
    return () => window.removeEventListener("jorata:node-menu", onNodeMenu);
  }, []);

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
  // the nav rail offsets those). screenToFlowPosition keeps this correct
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

  // Leaving connect mode always clears the pending source.
  const changeTool = useCallback((next: CanvasTool) => {
    setTool(next);
    setConnectFrom(null);
  }, []);

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
      if (mod || e.altKey) return;

      if (e.key === "Tab" && isCanvasTarget(e.target)) {
        // Tab grows the map (child of selection, or a new branch from root) —
        // outside the canvas it keeps its normal focus-navigation meaning.
        e.preventDefault();
        addNode("New Idea", selectedNodeId ?? ROOT_NODE_ID);
      } else if (e.key === "v" || e.key === "V") {
        e.preventDefault();
        changeTool("select");
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        changeTool(tool === "node" ? "select" : "node");
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        changeTool(tool === "connect" ? "select" : "connect");
        if (tool !== "connect") {
          addToast("Connect: click a source idea, then a target.", "info");
        }
      } else if (e.key === "s" || e.key === "S") {
        // Plain S drops a sticky at center — the fastest path; the sticky
        // tool (dock) covers click-to-place.
        e.preventDefault();
        addStickyAtCenter();
      } else if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        onOpenAi();
      } else if ((e.key === "Enter" || e.key === "F2") && selectedNodeId && isCanvasTarget(e.target)) {
        // F2 is the universal rename key; Enter is the keyboard-first path.
        e.preventDefault();
        beginEditing(selectedNodeId);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        fitView({ duration: 300, padding: 0.2, maxZoom: 1.25 });
      } else if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        toggleSidebar();
      } else if (e.key === "T" && e.shiftKey) {
        e.preventDefault();
        handleTidy();
      } else if (e.key === "Escape") {
        // Cancel order (§5.1): abort a running AI call first, then close chrome.
        if (abortActiveAi()) {
          addToast("Canceled", "info");
          return;
        }
        setMenu(null);
        selectNode(null);
        changeTool("select");
        setRefineOpen(false);
      }
    },
    [addNode, addStickyAtCenter, addToast, beginEditing, changeTool, fitView, handleTidy, onOpenAi, redo, selectNode, selectedNodeId, toggleSidebar, tool, undo]
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

  // Pane clicks place things when a placement tool is armed; otherwise they
  // clear selection as usual.
  const handlePaneClick = useCallback(
    (e: React.MouseEvent) => {
      setMenu(null);
      if (tool === "node" || tool === "sticky") {
        const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        if (tool === "node") {
          addNode("New Idea", undefined, {
            x: position.x - NODE_CENTER_OFFSET.x,
            y: position.y - NODE_CENTER_OFFSET.y,
          });
        } else {
          addStickyAt(position);
        }
        return;
      }
      setConnectFrom(null);
      selectNode(null);
    },
    [addNode, addStickyAt, screenToFlowPosition, selectNode, tool]
  );

  // Connect tool: first click picks the source, second click links it.
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: MindMapNode) => {
      if (tool !== "connect") return;
      if (!connectFrom) {
        setConnectFrom(node.id);
        addToast(`Connecting from "${node.data.label}" — click the target.`, "info");
        return;
      }
      if (connectFrom !== node.id) {
        onConnect({ source: connectFrom, target: node.id, sourceHandle: null, targetHandle: null });
      }
      setConnectFrom(null);
      changeTool("select");
    },
    [addToast, changeTool, connectFrom, onConnect, tool]
  );

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
        className={cn(
          "relative h-full min-w-0 flex-1",
          tool !== "select" && "[&_.react-flow__pane]:!cursor-crosshair"
        )}
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
              onNodeClick={handleNodeClick}
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
              panActivationKeyCode="Space"
              snapToGrid
              snapGrid={[12, 12]}
              minZoom={0.1}
              maxZoom={4}
              // Hiding the attribution is a React Flow Pro feature per xyflow's
              // terms — enabled at the project owner's request.
              proOptions={{ hideAttribution: true }}
              className="!bg-transparent"
            >
              <CanvasToolbar
                onTidy={handleTidy}
                onOpenAi={onOpenAi}
                view={view}
                onViewChange={onViewChange}
              />
              <ProposalBar
                busy={generating}
                onRegenerate={
                  lastTopic ? () => void runGenerate(lastTopic, true) : undefined
                }
                onRefine={lastTopic ? () => setRefineOpen(true) : undefined}
              />
              <CanvasDock tool={tool} onToolChange={changeTool} onOpenAi={onOpenAi} />
              <ZoomPill />
              <CanvasHints />
              <CanvasHelp />

              {/* §6.6: 1px dots on a 26px pitch. */}
              <Background
                variant={BackgroundVariant.Dots}
                gap={26}
                size={1}
                color="var(--color-dotgrid)"
              />

              {nodes.length > 4 && (
                <MiniMap
                  pannable
                  zoomable
                  nodeColor={(node) => {
                    if (node.type === "sticky") {
                      return STICKY_MINI_COLORS[(node.data?.color as string) ?? "yellow"] ?? "#E9DDB4";
                    }
                    if (node.data?.isRoot) return "#143024";
                    const branch = BRANCH_COLOR_STYLES[(node.data?.color as string) ?? ""];
                    if (branch) return branch.swatch;
                    if (node.data?.category === "goal") return "#24523B";
                    if (node.data?.category === "task") return "#1E9B68";
                    if (node.data?.category === "idea") return "#C99A2E";
                    if (node.data?.category === "warning") return "#A65A3A";
                    return "#C9C4B4";
                  }}
                  maskColor="rgba(246,243,235,0.75)"
                  className="!m-4 !rounded-node !border !border-line-hair !bg-card !shadow-float-1 overflow-hidden"
                  style={{ width: 132, height: 84 }}
                />
              )}
            </ReactFlow>
        </motion.div>

        {/* Empty map → the generation input is the front door (§5.1).
            Refine re-opens it prefilled over the pending proposals. */}
        <AnimatePresence>
          {((nodes.length <= 1 && proposedCount === 0) || refineOpen) && (
            <GenerationInvite
              key={refineOpen ? "refine" : "fresh"}
              initialTopic={refineOpen ? lastTopic ?? "" : ""}
              refining={refineOpen}
              generating={generating}
              onGenerate={(topic) => runGenerate(topic, refineOpen || nodes.length > 1)}
              onManualStart={() => addNode("New Idea", ROOT_NODE_ID)}
              onDismiss={refineOpen ? () => setRefineOpen(false) : undefined}
            />
          )}
        </AnimatePresence>

        {/* Node details panel — overlays the canvas edge, opens on demand */}
        <NodeIntelligenceSidebar />
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

/** Centered "What are we thinking about?" — the AI map-generation front door
 *  (§5.1). Doubles as the Refine surface, prefilled with the last topic. */
function GenerationInvite({
  initialTopic,
  refining,
  generating,
  onGenerate,
  onManualStart,
  onDismiss,
}: {
  initialTopic: string;
  refining: boolean;
  generating: boolean;
  onGenerate: (topic: string) => Promise<boolean>;
  onManualStart: () => void;
  onDismiss?: () => void;
}) {
  const [topic, setTopic] = useState(initialTopic);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || generating) return;
    const ok = await onGenerate(topic);
    if (ok && !refining) setTopic("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4"
    >
      <div
        className={cn(
          "pointer-events-auto w-full max-w-[460px] text-center",
          refining && "rounded-card border border-line-hair bg-card/95 p-6 shadow-float-3"
        )}
      >
        <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
          {refining ? "Refine the topic" : "New map"}
        </p>
        <h2 className="mt-2 font-serif text-[30px] leading-[1.15] text-ink-900">
          What are we thinking about?
        </h2>
        <form onSubmit={submit} className="mt-5">
          <div className="flex items-center gap-2 rounded-[16px] border border-line-strong bg-card p-2 pl-4 shadow-float-2 transition-colors focus-within:border-emerald-500">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && onDismiss) {
                  e.stopPropagation();
                  onDismiss();
                }
              }}
              placeholder="A decision, a project, a question…"
              disabled={generating}
              autoFocus={refining}
              className="w-full bg-transparent text-[15.5px] text-ink-900 placeholder:text-ink-400 focus:outline-none"
              aria-label="What are we thinking about?"
            />
            <button
              type="submit"
              disabled={!topic.trim() || generating}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-emerald-500 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-40"
            >
              {generating ? (
                <span
                  className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-white/40 border-t-white"
                  aria-hidden
                />
              ) : (
                <Sparkles size={13} />
              )}
              {generating ? "Thinking…" : refining ? "Regenerate" : "Generate"}
            </button>
          </div>
        </form>
        {generating ? (
          <p className="mt-4 text-[12.5px] text-ink-500">
            <kbd className="font-mono text-[11px]">Esc</kbd> to cancel
          </p>
        ) : refining ? (
          <button
            type="button"
            onClick={onDismiss}
            className="mt-4 text-[12.5px] text-ink-500 transition-colors hover:text-ink-900"
          >
            Keep the current proposals — <kbd className="font-mono text-[11px]">Esc</kbd>
          </button>
        ) : (
          <button
            type="button"
            onClick={onManualStart}
            className="mt-4 text-[12.5px] text-ink-500 transition-colors hover:text-ink-900"
          >
            or start by hand — double-click anywhere, <kbd className="font-mono text-[11px]">Tab</kbd> to branch
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── MindMapCanvas ────────────────────────────────────────────────────────────

export default function MindMapCanvas() {
  const isHydrated = useHydrated();
  const [view, setView] = useState<WorkspaceView>("map");
  const { openAssistant } = useUIActions();

  if (!isHydrated) {
    return <div className="h-full w-full bg-paper" />;
  }

  return (
    <div id="mindmap-canvas" className="relative flex h-full w-full overflow-hidden bg-paper">
      <ErrorBoundary fallbackTitle="Visual Workspace Error">
        <ReactFlowProvider>
          {view === "map" ? (
            <MindMapFlow onOpenAi={() => openAssistant()} view={view} onViewChange={setView} />
          ) : (
            <OutlineWorkspace view={view} onViewChange={setView} onOpenAi={() => openAssistant()} />
          )}
        </ReactFlowProvider>
      </ErrorBoundary>
    </div>
  );
}

/** Outline mode: same chrome grammar without the React Flow panels. */
function OutlineWorkspace({
  view,
  onViewChange,
  onOpenAi,
}: {
  view: WorkspaceView;
  onViewChange: (view: WorkspaceView) => void;
  onOpenAi: () => void;
}) {
  return (
    <div className="relative h-full w-full">
      <OutlineView />
      <div className="absolute left-4 top-4 z-10">
        <MapSwitcher />
      </div>
      <div className="absolute left-1/2 top-4 z-10 hidden -translate-x-1/2 sm:block">
        <div className="flex h-9 items-center gap-0.5 rounded-full bg-track p-1 shadow-float-1">
          {(["map", "outline"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onViewChange(v)}
              aria-pressed={view === v}
              className={cn(
                "h-7 rounded-full px-3.5 text-[12.5px] capitalize transition-colors",
                view === v
                  ? "bg-card font-semibold text-ink-900 shadow-float-1"
                  : "text-ink-600 hover:text-ink-900"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className="absolute right-4 top-4 z-10">
        <button
          type="button"
          onClick={onOpenAi}
          className="flex h-9 items-center gap-1.5 rounded-full bg-evergreen-900 px-4 text-[12.5px] font-medium text-[#E9EDE0] shadow-float-1 transition-colors hover:bg-evergreen-deep"
        >
          Ask Jorata
        </button>
      </div>
    </div>
  );
}

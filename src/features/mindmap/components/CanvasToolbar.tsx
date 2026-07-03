"use client";

import { useCallback, useMemo, useState, type KeyboardEvent } from "react";
import { Panel, useReactFlow, getNodesBounds, getViewportForBounds } from "@xyflow/react";
import { Search, Plus, Maximize, Sparkles, Download, PanelRight, Undo2, Redo2, StickyNote, Wand2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useMindMapNodes, useMindMapActions, useMindMapStore, useCanUndo, useCanRedo, ROOT_NODE_ID } from "@/stores/use-mindmap-store";
import { exportViewportToPng } from "@/lib/export";
import { cn } from "@/lib/cn";
import MapSwitcher from "./MapSwitcher";
import AiGenerateModal from "@/features/ai/AiGenerateModal";
import FixMapModal from "@/features/ai/FixMapModal";

export default function CanvasToolbar({
  onTidy,
  onAddSticky,
  onOpenAi,
}: {
  onTidy: () => void;
  onAddSticky: () => void;
  onOpenAi: () => void;
}) {
  const nodes = useMindMapNodes();
  const selectedNodeId = useMindMapStore((state) => state.selectedNodeId);
  const sidebarOpen = useMindMapStore((state) => state.sidebarOpen);
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const { addNode, selectNode, toggleSidebar, undo, redo } = useMindMapActions();
  const { fitView, setCenter, getNodes } = useReactFlow();
  const [search, setSearch] = useState("");
  const [aiGenerateOpen, setAiGenerateOpen] = useState(false);
  const [fixMapOpen, setFixMapOpen] = useState(false);

  const matchingNode = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return nodes.find((node) => node.data.label.toLowerCase().includes(q)) ?? null;
  }, [nodes, search]);

  const handleSearchKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && matchingNode) {
        selectNode(matchingNode.id);
        setCenter(matchingNode.position.x + 80, matchingNode.position.y + 20, {
          zoom: 1.2,
          duration: 400,
        });
      }
    },
    [matchingNode, selectNode, setCenter]
  );

  // Always connect: child of the selected node, or of the root when nothing is
  // selected — matching the Tab shortcut, so the button never drops an orphan.
  const handleAddNode = useCallback(() => {
    addNode("New Idea", selectedNodeId ?? ROOT_NODE_ID);
  }, [addNode, selectedNodeId]);

  const handleFitView = useCallback(() => {
    fitView({ duration: 300, padding: 0.2, maxZoom: 1.25 });
  }, [fitView]);

  const handleExport = useCallback(async () => {
    const viewport = document
      .getElementById("mindmap-canvas")
      ?.querySelector<HTMLElement>(".react-flow__viewport");
    // Frame on the visible nodes, not the collapsed/hidden ones (they aren't
    // in the DOM, so including them would leave dead space in the export).
    const visibleNodes = getNodes().filter((node) => !node.hidden);
    if (!viewport || visibleNodes.length === 0) return;

    const bounds = getNodesBounds(visibleNodes);
    const aspect = bounds.width / bounds.height || 1;
    // Tight-but-not-tiny: scale the map's own aspect ratio so the longer side
    // lands between 900 and 2600px; pixelRatio:2 keeps text crisp on top.
    const longSide = Math.min(Math.max(bounds.width, bounds.height, 900), 2600);
    const width = Math.round(aspect >= 1 ? longSide : longSide * aspect);
    const height = Math.round(aspect >= 1 ? longSide / aspect : longSide);
    const transform = getViewportForBounds(bounds, width, height, 0.1, 2, 0.14);

    await exportViewportToPng(
      viewport,
      width,
      height,
      transform,
      `jorata-export-${Date.now()}.png`,
    );
  }, [getNodes]);

  return (
    <Panel position="top-left" className="z-10 ml-4 mt-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Which map am I in? Click to switch or create. */}
        <MapSwitcher />

        {/* Generate a whole map from one topic. */}
        <Button
          size="sm"
          className="h-9 gap-2 rounded-full border border-violet-500/30 bg-violet-500/15 px-4 text-violet-200 shadow-xl hover:bg-violet-500/25"
          variant="secondary"
          onClick={() => setAiGenerateOpen(true)}
          title="Generate a mind map with AI"
        >
          <Wand2 size={14} className="text-violet-300" />
          <span className="hidden md:inline">AI Generate</span>
        </Button>

        {/* Chat with the AI about the current map. Lives IN the toolbar (rather
            than floating over the top-right corner) so it can never overlap the
            canvas controls or other buttons. */}
        <Button
          size="sm"
          className="h-9 gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-4 text-emerald-200 shadow-xl hover:bg-emerald-500/25"
          variant="secondary"
          onClick={onOpenAi}
          title="Ask Jorata AI"
        >
          <Sparkles size={14} className="text-emerald-300" />
          <span className="hidden md:inline">Ask AI</span>
        </Button>

        {/* Review the whole map's structure — proposals only, applied after
            the user reviews them. Neutral styling: it's a maintenance tool,
            not a third accent color. */}
        <Button
          variant="secondary"
          size="sm"
          className="h-9 gap-2 rounded-full border border-white/5 bg-zinc-900/60 px-4 shadow-xl backdrop-blur-xl hover:bg-zinc-900/80"
          onClick={() => setFixMapOpen(true)}
          title="Review & improve this map's structure"
        >
          <Wrench size={14} className="text-zinc-400" />
          <span className="hidden md:inline">Fix map</span>
        </Button>

        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Find an idea..."
            className="h-9 w-44 rounded-full border border-white/5 bg-zinc-900/60 pl-9 pr-4 text-[12px] text-zinc-200 shadow-2xl outline-none backdrop-blur-xl transition-all focus:border-emerald-500/20 focus:bg-zinc-900/80 xl:w-56"
          />
        </div>

        <Button
          size="sm"
          className="h-9 gap-2 rounded-full border border-emerald-500/20 px-4 shadow-xl"
          onClick={handleAddNode}
          title={selectedNodeId ? "Add child of selected idea (Tab)" : "Add idea under root (Tab)"}
        >
          <Plus size={14} />
          <span>Idea</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="h-9 gap-2 rounded-full border border-white/5 bg-zinc-900/60 px-4 shadow-xl backdrop-blur-xl hover:bg-zinc-900/80"
          onClick={onAddSticky}
          title="Add sticky note (S)"
        >
          <StickyNote size={14} className="text-yellow-400" />
          <span className="hidden md:inline">Sticky</span>
        </Button>
        <div className="flex items-center rounded-full border border-white/5 bg-zinc-900/60 shadow-xl backdrop-blur-xl">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-l-full rounded-r-none p-0"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Undo2 size={14} />
          </Button>
          <div className="h-4 w-px bg-white/5" />
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-r-full rounded-l-none p-0"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            aria-label="Redo"
          >
            <Redo2 size={14} />
          </Button>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="hidden h-9 w-9 rounded-full border border-white/5 p-0 shadow-xl sm:flex"
          onClick={onTidy}
          title="Tidy map (Shift+T)"
          aria-label="Tidy map"
        >
          <Sparkles size={14} className="text-amber-400" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="h-9 w-9 rounded-full border border-white/5 p-0 shadow-xl"
          onClick={handleFitView}
          title="Fit view (F)"
          aria-label="Fit view"
        >
          <Maximize size={14} />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="hidden h-9 w-9 rounded-full border border-white/5 p-0 shadow-xl sm:flex"
          onClick={handleExport}
          title="Export as PNG"
          aria-label="Export as PNG"
        >
          <Download size={14} className="text-emerald-400" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className={cn(
            "h-9 w-9 rounded-full border border-white/5 p-0 shadow-xl",
            sidebarOpen && "border-emerald-500/30 text-emerald-400"
          )}
          onClick={() => toggleSidebar()}
          title="Node details (I)"
          aria-label="Toggle node details"
        >
          <PanelRight size={14} />
        </Button>
      </div>

      {aiGenerateOpen && <AiGenerateModal onClose={() => setAiGenerateOpen(false)} />}
      {fixMapOpen && <FixMapModal onClose={() => setFixMapOpen(false)} />}
    </Panel>
  );
}

"use client";

import { useCallback, useMemo, useState, type KeyboardEvent, type MouseEvent } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  type EdgeTypes,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import EditableNode from "./EditableNode";
import NodeContextMenu from "./components/NodeContextMenu";
import NodeIntelligenceSidebar from "./components/NodeIntelligenceSidebar";
import { Button } from "@/components/ui/Button";
import { 
  useMindMapNodes, 
  useMindMapEdges, 
  useMindMapActions, 
  MindMapNode
} from "@/stores/use-mindmap-store";
import { Search, Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

// ─── Constants ────────────────────────────────────────────────────────────────

const nodeTypes: NodeTypes = {
  editable: EditableNode,
};

const edgeTypes: EdgeTypes = {};

// ─── MindMapCanvas ────────────────────────────────────────────────────────────

export default function MindMapCanvas() {
  const nodes = useMindMapNodes();
  const edges = useMindMapEdges();
  const { onNodesChange, onEdgesChange, onConnect, addNode, selectNode } = useMindMapActions();

  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [search, setSearch] = useState("");

  const onNodeContextMenu = useCallback(
    (event: MouseEvent, node: MindMapNode) => {
      event.preventDefault();
      setMenu({
        id: node.id,
        x: event.clientX,
        y: event.clientY,
      });
    },
    []
  );

  const matchingNodeId = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return null;

    return nodes.find((node) => node.data.label.toLowerCase().includes(q))?.id ?? null;
  }, [nodes, search]);

  const handleSearchKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && matchingNodeId) {
        selectNode(matchingNodeId);
      }
    },
    [matchingNodeId, selectNode]
  );

  const handlePaneClick = useCallback(() => {
    setMenu(null);
    selectNode(null);
  }, [selectNode]);

  const handleAddNode = useCallback(() => {
    addNode("New Idea");
  }, [addNode]);

  return (
    <div className="relative flex h-[calc(100vh-120px)] w-full overflow-hidden bg-[#09090b]">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.5 }}
          minZoom={0.1}
          maxZoom={4}
          className="bg-[#09090b]"
        >
          {/* Search Bar Panel */}
          <Panel position="top-left" className="z-10 mt-4 ml-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search nodes..."
                  className="h-9 w-64 rounded-full border border-white/10 bg-zinc-900/80 pl-9 pr-4 text-[12px] text-zinc-200 outline-none backdrop-blur-xl focus:border-emerald-500/30 transition-all shadow-2xl"
                />
              </div>
              <Button size="sm" className="rounded-full h-9 gap-2 px-4 shadow-xl" onClick={handleAddNode}>
                <Plus size={14} />
                <span>Node</span>
              </Button>
            </div>
          </Panel>

          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="rgba(255,255,255,0.03)"
          />
          
          <MiniMap 
            nodeColor={(node) => {
              if (node.data?.isRoot) return "#10b981";
              if (node.data?.category === "goal") return "#6366f1";
              if (node.data?.category === "task") return "#10b981";
              return "#27272a";
            }}
            maskColor="rgba(0,0,0,0.7)"
            className="!bg-zinc-950 !border-white/5 !rounded-2xl shadow-2xl"
            style={{ width: 120, height: 100 }}
          />
          
          <Controls 
            showInteractive={false}
            className="!bg-zinc-900 !border-white/10 !rounded-xl !shadow-2xl overflow-hidden"
          />

          {/* Categories Legend */}
          <Panel position="bottom-left" className="mb-4 ml-4">
            <div className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-zinc-900/50 p-4 backdrop-blur-xl">
               <LegendItem color="bg-indigo-500" label="Goal" />
               <LegendItem color="bg-emerald-500" label="Action" />
               <LegendItem color="bg-violet-500" label="Idea" />
               <LegendItem color="bg-rose-500" label="Risk" />
            </div>
          </Panel>
        </ReactFlow>
      </ReactFlowProvider>

      {/* Overlays */}
      <AnimatePresence>
        {menu && (
          <NodeContextMenu
            id={menu.id}
            x={menu.x}
            y={menu.y}
            onClose={() => setMenu(null)}
          />
        )}
      </AnimatePresence>

      <NodeIntelligenceSidebar />
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-1.5 w-1.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.1)]", color)} />
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</span>
    </div>
  );
}

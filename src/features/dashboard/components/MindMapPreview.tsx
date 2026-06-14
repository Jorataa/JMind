"use client";

import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import EditableNode from "@/features/mindmap/EditableNode";
import StickyNode from "@/features/mindmap/StickyNode";
import {
  useMindMapNodes,
  useMindMapEdges,
  useMindMapViewport,
  useMindMapStore,
} from "@/stores/use-mindmap-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { Card } from "@/components/ui/Card";
import { Maximize2 } from "lucide-react";
import Link from "next/link";

const nodeTypes: NodeTypes = {
  editable: EditableNode,
  sticky: StickyNode,
};

export default function MindMapPreview() {
  const nodes = useMindMapNodes();
  const edges = useMindMapEdges();
  const viewport = useMindMapViewport();
  const activeMapTitle = useMindMapStore((state) => state.maps[state.activeMapId]?.title);
  const isHydrated = useHydrated();

  if (!isHydrated) {
    return (
      <Card className="h-[400px] w-full animate-pulse bg-white/[0.02]" />
    );
  }

  return (
    // The whole preview is the link — clicking anywhere opens the canvas.
    <Link
      href="/mindmap"
      aria-label={`Open ${activeMapTitle ?? "mind map"}`}
      className="group relative block h-[400px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#09090b] shadow-2xl shadow-black/40 transition-colors hover:border-emerald-500/30 focus-visible:border-emerald-500/40"
    >
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          defaultViewport={viewport}
          fitView
          fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={true}
          proOptions={{ hideAttribution: true }}
          className="bg-[#09090b] pointer-events-none"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="rgba(255,255,255,0.03)"
          />
        </ReactFlow>
      </ReactFlowProvider>

      {/* Hover affordance — a visual cue only (not a nested link). */}
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 via-transparent to-transparent pb-8 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 text-[13px] font-semibold text-zinc-950 shadow-2xl shadow-emerald-500/20 h-10">
          <Maximize2 size={16} />
          Open Mind Map
        </span>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <span className="block max-w-[200px] truncate rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 backdrop-blur-md">
          {activeMapTitle ?? "Snapshot"}
        </span>
      </div>
    </Link>
  );
}

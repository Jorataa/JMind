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
} from "@/stores/use-mindmap-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/cn";
import Link from "next/link";

const nodeTypes: NodeTypes = {
  editable: EditableNode,
  sticky: StickyNode,
};

/**
 * Read-only glance at the active map (Dashboard workspace cell, mockup #3a).
 * The whole surface is the link — clicking anywhere opens the canvas.
 */
export default function MindMapPreview({ className }: { className?: string }) {
  const nodes = useMindMapNodes();
  const edges = useMindMapEdges();
  const viewport = useMindMapViewport();
  const isHydrated = useHydrated();

  if (!isHydrated) {
    return <div className={cn("skeleton-shimmer rounded-inner", className)} />;
  }

  return (
    <Link
      href="/mindmap"
      aria-label="Open the Workspace"
      tabIndex={-1}
      className={cn(
        "group relative block overflow-hidden rounded-inner border border-line-hair bg-paper transition-colors hover:border-[#CFC9B8]",
        className
      )}
    >
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          defaultViewport={viewport}
          fitView
          fitViewOptions={{ padding: 0.25, maxZoom: 0.9 }}
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
          className="pointer-events-none !bg-transparent"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={26}
            size={1}
            color="var(--color-dotgrid)"
          />
        </ReactFlow>
      </ReactFlowProvider>
    </Link>
  );
}

"use client";

import { Panel, useReactFlow, useViewport } from "@xyflow/react";
import {
  MousePointer2,
  SquarePlus,
  Spline,
  StickyNote,
  Sparkles,
  Minus,
  Plus,
  List,
} from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Bottom canvas chrome (design handoff §6.6):
 *  center  tool pill — Select V · Node N · Connect C · Sticky S · Ask (J)
 *  right   zoom pill — − % + · Fit
 *  left    quiet hints line
 * Active tool = dark circle.
 */

export type CanvasTool = "select" | "node" | "connect" | "sticky";

const TOOLS: { id: CanvasTool; label: string; key: string; Icon: typeof MousePointer2 }[] = [
  { id: "select", label: "Select", key: "V", Icon: MousePointer2 },
  { id: "node", label: "Node", key: "N", Icon: SquarePlus },
  { id: "connect", label: "Connect", key: "C", Icon: Spline },
  { id: "sticky", label: "Sticky", key: "S", Icon: StickyNote },
];

export function CanvasDock({
  tool,
  onToolChange,
  onOpenAi,
  onShowOutline,
}: {
  tool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  onOpenAi: () => void;
  /** Mobile-only escape hatch — the top view switcher is hidden below sm. */
  onShowOutline?: () => void;
}) {
  return (
    <Panel position="bottom-center" className="z-10 !mb-[76px] md:!mb-4">
      <div className="flex items-center gap-1 rounded-full border border-line-hair bg-card p-1.5 shadow-float-2">
        {TOOLS.map(({ id, label, key, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onToolChange(id)}
            aria-pressed={tool === id}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
              tool === id
                ? "bg-evergreen-900 text-[#E9EDE0]"
                : "text-ink-600 hover:bg-sunken hover:text-ink-900"
            )}
            title={`${label} (${key})`}
            aria-label={`${label} tool`}
          >
            <Icon size={14.5} strokeWidth={1.9} />
          </button>
        ))}
        {onShowOutline && (
          <button
            type="button"
            onClick={onShowOutline}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-sunken hover:text-ink-900 sm:hidden"
            title="Outline view"
            aria-label="Switch to outline view"
          >
            <List size={14.5} strokeWidth={1.9} />
          </button>
        )}
        <span aria-hidden className="mx-1 h-4 w-px bg-line-hair" />
        <button
          type="button"
          onClick={onOpenAi}
          className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-green-800 transition-colors hover:bg-sage-surface"
          title="Ask Jorata (J)"
        >
          <Sparkles size={13} />
          Ask
          <kbd className="font-mono text-[10px] font-normal text-ink-500">J</kbd>
        </button>
      </div>
    </Panel>
  );
}

export function ZoomPill() {
  const { zoom } = useViewport();
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <Panel position="bottom-right" className="z-10 !m-4 !mb-[76px] md:!mb-4">
      <div className="flex h-9 items-center gap-0.5 rounded-full border border-line-hair bg-card px-1.5 shadow-float-1">
        <button
          type="button"
          onClick={() => zoomOut({ duration: 200 })}
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-sunken hover:text-ink-900"
          aria-label="Zoom out"
        >
          <Minus size={13} />
        </button>
        <span className="min-w-[42px] text-center font-mono text-[11.5px] text-ink-600">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomIn({ duration: 200 })}
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-sunken hover:text-ink-900"
          aria-label="Zoom in"
        >
          <Plus size={13} />
        </button>
        <span aria-hidden className="mx-0.5 h-4 w-px bg-line-hair" />
        <button
          type="button"
          onClick={() => fitView({ duration: 300, padding: 0.2, maxZoom: 1.25 })}
          className="rounded-full px-2 text-[11.5px] text-ink-600 transition-colors hover:text-ink-900"
          title="Fit view (F)"
        >
          Fit
        </button>
      </div>
    </Panel>
  );
}

export function CanvasHints() {
  return (
    <Panel position="bottom-left" className="z-10 !m-4 hidden lg:block">
      <p className="select-none text-[12px] text-ink-400">
        double-click: node · tab: branch · drag edge: connect · space: pan
      </p>
    </Panel>
  );
}

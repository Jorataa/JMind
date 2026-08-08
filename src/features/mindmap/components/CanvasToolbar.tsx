"use client";

import { useState } from "react";
import { Panel } from "@xyflow/react";
import {
  Sparkles,
  PanelRight,
  Undo2,
  Redo2,
  Wand2,
  Wrench,
} from "lucide-react";
import {
  useMindMapActions,
  useMindMapStore,
  useCanUndo,
  useCanRedo,
} from "@/stores/use-mindmap-store";
import { cn } from "@/lib/cn";
import MapSwitcher from "./MapSwitcher";
import ExportMenu from "./ExportMenu";
import AiGenerateModal from "@/features/ai/AiGenerateModal";
import FixMapModal from "@/features/ai/FixMapModal";

/**
 * Workspace top chrome (design handoff §6.2, mockup #2b) — floating paper
 * pills inset from the frame:
 *   left   breadcrumb (MapSwitcher) · history/tidy/AI-structure pill
 *   center Map / Outline view switcher
 *   right  Download · Ask Jorata (dark) · details-panel toggle
 */

export type WorkspaceView = "map" | "outline";

const ICON_BTN =
  "flex h-7 w-7 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-sunken hover:text-ink-900 disabled:pointer-events-none disabled:opacity-40";

function Divider() {
  return <span aria-hidden className="h-4 w-px shrink-0 bg-line-hair" />;
}

export default function CanvasToolbar({
  onTidy,
  onOpenAi,
  view,
  onViewChange,
}: {
  onTidy: () => void;
  onOpenAi: () => void;
  view: WorkspaceView;
  onViewChange: (view: WorkspaceView) => void;
}) {
  const sidebarOpen = useMindMapStore((state) => state.sidebarOpen);
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const { toggleSidebar, undo, redo } = useMindMapActions();
  const [aiGenerateOpen, setAiGenerateOpen] = useState(false);
  const [fixMapOpen, setFixMapOpen] = useState(false);

  return (
    <>
      {/* ── Left: breadcrumb + history/structure ── */}
      <Panel position="top-left" className="z-10 !m-4">
        <div className="flex flex-wrap items-center gap-2">
          <MapSwitcher />

          <div className="flex h-9 items-center gap-0.5 rounded-full border border-line-hair bg-card px-1.5 shadow-float-1">
            <button
              type="button"
              className={ICON_BTN}
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <Undo2 size={13.5} />
            </button>
            <button
              type="button"
              className={ICON_BTN}
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
              aria-label="Redo"
            >
              <Redo2 size={13.5} />
            </button>
            <Divider />
            <button
              type="button"
              className={ICON_BTN}
              onClick={onTidy}
              title="Tidy map (Shift+T)"
              aria-label="Tidy map"
            >
              <Sparkles size={13.5} />
            </button>
            <Divider />
            <button
              type="button"
              className={ICON_BTN}
              onClick={() => setAiGenerateOpen(true)}
              title="Generate a whole mind map with AI"
              aria-label="Generate a mind map with AI"
            >
              <Wand2 size={13.5} />
            </button>
            <button
              type="button"
              className={ICON_BTN}
              onClick={() => setFixMapOpen(true)}
              title="Review & improve this map's structure"
              aria-label="Review map structure"
            >
              <Wrench size={13.5} />
            </button>
          </div>
        </div>
      </Panel>

      {/* ── Center: view switcher ── */}
      <Panel position="top-center" className="z-10 !mt-4 hidden sm:block">
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
      </Panel>

      {/* ── Right: download · ask · details ── */}
      <Panel position="top-right" className="z-10 !m-4">
        <div className="flex items-center gap-2">
          <ExportMenu />
          <button
            type="button"
            onClick={onOpenAi}
            className="flex h-9 items-center gap-1.5 rounded-full bg-evergreen-900 px-4 text-[12.5px] font-medium text-[#E9EDE0] shadow-float-1 transition-colors hover:bg-evergreen-deep"
            title="Ask Jorata about this map (J)"
          >
            Ask Jorata
          </button>
          <button
            type="button"
            onClick={() => toggleSidebar()}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border border-line-hair bg-card shadow-float-1 transition-colors",
              sidebarOpen
                ? "border-green-800 text-green-800"
                : "text-ink-600 hover:text-ink-900"
            )}
            title="Node details (I)"
            aria-label="Toggle node details"
          >
            <PanelRight size={14} />
          </button>
        </div>
      </Panel>

      {aiGenerateOpen && <AiGenerateModal onClose={() => setAiGenerateOpen(false)} />}
      {fixMapOpen && <FixMapModal onClose={() => setFixMapOpen(false)} />}
    </>
  );
}

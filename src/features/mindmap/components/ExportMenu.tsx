"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReactFlow, getNodesBounds, getViewportForBounds } from "@xyflow/react";
import { Download, Image as ImageIcon, FileText, Braces, Loader2 } from "lucide-react";
import { useMindMapStore } from "@/stores/use-mindmap-store";
import { useToast } from "@/stores/use-toast-store";
import {
  exportViewportToPng,
  buildOutlineMarkdown,
  buildMapJson,
  exportFileName,
  downloadTextFile,
} from "@/lib/export";
import { cn } from "@/lib/cn";

/**
 * Download (design pass 2): replaces the misleading "Share" pill. One button,
 * three honest formats — a picture of the map, a Markdown outline that pastes
 * anywhere, and a JSON backup of the raw data.
 */
export default function ExportMenu({
  pngAvailable = true,
}: {
  /** False in Outline view, where no canvas is mounted to photograph. */
  pngAvailable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<null | "png" | "md" | "json">(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const addToast = useToast();
  const { getNodes } = useReactFlow();

  // Standard menu manners: click-away or Escape dismisses.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const mapTitle = () => {
    const state = useMindMapStore.getState();
    return state.maps[state.activeMapId]?.title ?? "Mind map";
  };

  const handlePng = async () => {
    const viewport = document
      .getElementById("mindmap-canvas")
      ?.querySelector<HTMLElement>(".react-flow__viewport");
    const visibleNodes = getNodes().filter((node) => !node.hidden);
    if (!viewport || visibleNodes.length === 0) {
      addToast("Nothing on the canvas to photograph yet.", "info");
      return;
    }

    setBusy("png");
    try {
      const bounds = getNodesBounds(visibleNodes);
      const aspect = bounds.width / bounds.height || 1;
      // Tight-but-not-tiny: the longer side lands between 900 and 2600px;
      // pixelRatio:2 inside keeps text crisp on top.
      const longSide = Math.min(Math.max(bounds.width, bounds.height, 900), 2600);
      const width = Math.round(aspect >= 1 ? longSide : longSide * aspect);
      const height = Math.round(aspect >= 1 ? longSide / aspect : longSide);
      const transform = getViewportForBounds(bounds, width, height, 0.1, 2, 0.14);

      const ok = await exportViewportToPng(
        viewport,
        width,
        height,
        transform,
        exportFileName(mapTitle(), "png")
      );
      addToast(ok ? "Image saved to your downloads" : "Export failed — try again", ok ? "success" : "error");
    } finally {
      setBusy(null);
      setOpen(false);
    }
  };

  const handleMarkdown = () => {
    setBusy("md");
    try {
      const { nodes, edges } = useMindMapStore.getState();
      const title = mapTitle();
      downloadAndToast(
        exportFileName(title, "md"),
        buildOutlineMarkdown(title, nodes, edges),
        "text/markdown"
      );
    } finally {
      setBusy(null);
      setOpen(false);
    }
  };

  const handleJson = () => {
    setBusy("json");
    try {
      const { nodes, edges } = useMindMapStore.getState();
      const title = mapTitle();
      downloadAndToast(exportFileName(title, "json"), buildMapJson(title, nodes, edges), "application/json");
    } finally {
      setBusy(null);
      setOpen(false);
    }
  };

  const downloadAndToast = (fileName: string, content: string, mime: string) => {
    downloadTextFile(fileName, content, mime);
    addToast("Saved to your downloads", "success");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-full border bg-card px-3.5 text-[12.5px] shadow-float-1 transition-colors",
          open
            ? "border-green-800 text-green-800"
            : "border-line-hair text-green-800 hover:border-green-800"
        )}
        title="Download this map"
      >
        <Download size={12.5} />
        <span className="hidden md:inline">Download</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            role="menu"
            aria-label="Download formats"
            className="absolute right-0 top-full z-30 mt-2 w-[268px] overflow-hidden rounded-node border border-line-hair bg-card p-1.5 shadow-float-3"
          >
            <p className="px-2.5 pb-1 pt-1.5 text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
              Download as
            </p>
            <ExportItem
              icon={busy === "png" ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
              label="Image"
              tag="PNG"
              description={
                pngAvailable
                  ? "A crisp picture of the whole map"
                  : "Switch to Map view to photograph it"
              }
              disabled={!pngAvailable || busy !== null}
              onClick={handlePng}
            />
            <ExportItem
              icon={<FileText size={14} />}
              label="Outline"
              tag="MD"
              description="Nested Markdown — pastes into any doc"
              disabled={busy !== null}
              onClick={handleMarkdown}
            />
            <ExportItem
              icon={<Braces size={14} />}
              label="Data"
              tag="JSON"
              description="A full backup of this map"
              disabled={busy !== null}
              onClick={handleJson}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ExportItem({
  icon,
  label,
  tag,
  description,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  tag: string;
  description: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className="group flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-left transition-colors hover:bg-sunken disabled:pointer-events-none disabled:opacity-45"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-sage-surface text-green-800">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-ink-900">{label}</span>
          <span className="rounded-[4px] bg-sunken px-1 py-px font-mono text-[9.5px] font-medium tracking-wide text-ink-500 group-hover:bg-card">
            {tag}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-[11.5px] leading-snug text-ink-500">
          {description}
        </span>
      </span>
    </button>
  );
}

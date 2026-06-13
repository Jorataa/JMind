"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronsUpDown, FileText, Plus } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useMindMapStore, useMindMapNodes, useMindMapEdges } from "@/stores/use-mindmap-store";
import { cn } from "@/lib/cn";

/**
 * The canvas's "where am I?" anchor and map switcher in one: shows the active
 * map title with a quiet autosave pulse, and opens a popover to jump between
 * maps or start a new one — so multi-map flow never depends on the nav
 * sidebar being expanded. Rename/delete stay in the sidebar's map list.
 */
export default function MapSwitcher() {
  const nodes = useMindMapNodes();
  const edges = useMindMapEdges();
  const { maps, activeMapId, createMap, switchMap } = useMindMapStore(
    useShallow((state) => ({
      maps: state.maps,
      activeMapId: state.activeMapId,
      createMap: state.actions.createMap,
      switchMap: state.actions.switchMap,
    }))
  );
  const activeTitle = maps[activeMapId]?.title ?? "Mind Map";

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Quiet autosave acknowledgement: appears shortly after edits settle,
  // then fades. Skips the initial render and map loads-by-navigation.
  const [showSaved, setShowSaved] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    let hideTimer: number | undefined;
    const showTimer = window.setTimeout(() => {
      setShowSaved(true);
      hideTimer = window.setTimeout(() => setShowSaved(false), 1800);
    }, 800);

    return () => {
      window.clearTimeout(showTimer);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, [nodes, edges]);

  // Dismiss on click-away or Escape — standard menu manners.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleSwitch = (id: string) => {
    if (id !== activeMapId) switchMap(id);
    setOpen(false);
  };

  const handleCreate = () => {
    createMap();
    setOpen(false);
  };

  const sortedMaps = Object.values(maps).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        title="Switch mind map"
        className={cn(
          "flex h-9 items-center gap-2 rounded-full border border-white/5 bg-zinc-900/60 px-3 shadow-xl backdrop-blur-xl transition-colors hover:border-white/15 hover:bg-zinc-900/80",
          open && "border-white/15 bg-zinc-900/80"
        )}
      >
        <FileText size={12} className="shrink-0 text-emerald-400" />
        <span className="max-w-[150px] truncate text-[12px] font-medium text-zinc-200">
          {activeTitle}
        </span>
        <AnimatePresence>
          {showSaved && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500/80"
            >
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
              Saved
            </motion.span>
          )}
        </AnimatePresence>
        <ChevronsUpDown size={12} className="shrink-0 text-zinc-500" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-11 z-30 w-[260px] overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/90 shadow-2xl backdrop-blur-xl"
          >
            <p className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Mind Maps
            </p>
            <div className="max-h-[280px] overflow-y-auto p-1.5 custom-scrollbar">
              {sortedMaps.map((map) => {
                const isActive = map.id === activeMapId;
                const nodeCount = isActive ? nodes.length : map.nodes.length;

                return (
                  <button
                    key={map.id}
                    type="button"
                    onClick={() => handleSwitch(map.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors",
                      isActive
                        ? "bg-emerald-500/10 text-emerald-50"
                        : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                    )}
                  >
                    <FileText
                      size={13}
                      className={cn("shrink-0", isActive ? "text-emerald-400" : "text-zinc-600")}
                    />
                    <span className="min-w-0 flex-1 truncate">{map.title}</span>
                    <span className="shrink-0 text-[10px] font-semibold text-zinc-600">
                      {nodeCount} {nodeCount === 1 ? "idea" : "ideas"}
                    </span>
                    {isActive && <Check size={13} className="shrink-0 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-white/5 p-1.5">
              <button
                type="button"
                onClick={handleCreate}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-zinc-100"
              >
                <Plus size={13} className="shrink-0 text-emerald-400" />
                New mind map
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

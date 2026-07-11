"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronsUpDown, FileText, Plus, Edit3, Trash2 } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useMindMapStore, useMindMapNodes, useMindMapEdges } from "@/stores/use-mindmap-store";
import { useGroves, GROVE_DOT_CLASS } from "@/stores/use-grove-store";
import { cn } from "@/lib/cn";

/**
 * The Workspace breadcrumb pill (design handoff §6.2): grove dot + grove /
 * map title + a quiet autosave pulse. Click to open the map popover — switch,
 * create, rename, delete, and file the active map into a grove — so multi-map
 * flow never depends on the collapsed rail.
 */
export default function MapSwitcher() {
  const nodes = useMindMapNodes();
  const edges = useMindMapEdges();
  const { maps, activeMapId, createMap, switchMap, renameMap, deleteMap, assignMapToGrove } =
    useMindMapStore(
      useShallow((state) => ({
        maps: state.maps,
        activeMapId: state.activeMapId,
        createMap: state.actions.createMap,
        switchMap: state.actions.switchMap,
        renameMap: state.actions.renameMap,
        deleteMap: state.actions.deleteMap,
        assignMapToGrove: state.actions.assignMapToGrove,
      }))
    );
  const groves = useGroves();
  const activeMap = maps[activeMapId];
  const activeTitle = activeMap?.title ?? "Mind Map";
  const activeGrove = groves.find((g) => g.id === activeMap?.groveId);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
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

  // Leaving the popover abandons any in-progress rename or delete confirm.
  useEffect(() => {
    if (!open) {
      setEditingId(null);
      setConfirmDeleteId(null);
    }
  }, [open]);

  // Disarm the delete confirmation if the user walks away.
  useEffect(() => {
    if (!confirmDeleteId) return;
    const timer = window.setTimeout(() => setConfirmDeleteId(null), 3000);
    return () => window.clearTimeout(timer);
  }, [confirmDeleteId]);

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

  const handleStartRename = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const handleCommitRename = () => {
    if (editingId) {
      const trimmed = editTitle.trim();
      if (trimmed && trimmed.length <= 40 && trimmed !== maps[editingId]?.title) {
        renameMap(editingId, trimmed);
      }
      setEditingId(null);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (Object.keys(maps).length <= 1) return;
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setConfirmDeleteId(null);
    deleteMap(id);
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
          "flex h-9 items-center gap-2 rounded-full border border-line-hair bg-card px-3.5 shadow-float-1 transition-colors hover:border-line-strong",
          open && "border-line-strong"
        )}
      >
        {activeGrove ? (
          <>
            <span
              className={cn(
                "h-[7px] w-[7px] shrink-0 rounded-[3px]",
                GROVE_DOT_CLASS[activeGrove.color]
              )}
            />
            <span className="hidden max-w-[110px] truncate text-[12px] text-ink-500 sm:block">
              {activeGrove.name}
            </span>
            <span className="hidden text-[12px] text-ink-400 sm:block">/</span>
          </>
        ) : (
          <FileText size={12} className="shrink-0 text-ink-500" />
        )}
        <span className="max-w-[150px] truncate text-[12.5px] font-semibold text-ink-900">
          {activeTitle}
        </span>
        <AnimatePresence>
          {showSaved && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-[10px] font-medium lowercase tracking-wide text-emerald-600"
            >
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
              saved
            </motion.span>
          )}
        </AnimatePresence>
        <ChevronsUpDown size={12} className="shrink-0 text-ink-400" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-11 z-30 w-[280px] overflow-hidden rounded-node border border-line-hair bg-card shadow-float-2"
          >
            <p className="px-4 pb-1 pt-3 text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
              Maps
            </p>
            <div className="custom-scrollbar max-h-[280px] overflow-y-auto p-1.5">
              {sortedMaps.map((map) => {
                const isActive = map.id === activeMapId;
                const isEditing = editingId === map.id;
                const isConfirming = confirmDeleteId === map.id;
                const nodeCount = isActive ? nodes.length : map.nodes.length;
                const grove = groves.find((g) => g.id === map.groveId);

                return (
                  <div
                    key={map.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => !isEditing && handleSwitch(map.id)}
                    onKeyDown={(e) => {
                      if (!isEditing && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        handleSwitch(map.id);
                      }
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleStartRename(map.id, map.title);
                    }}
                    className={cn(
                      "group flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] font-medium transition-colors",
                      isActive
                        ? "bg-sage-surface text-evergreen-950"
                        : "text-ink-600 hover:bg-sunken hover:text-ink-900"
                    )}
                  >
                    {grove ? (
                      <span
                        className={cn(
                          "h-[7px] w-[7px] shrink-0 rounded-[3px]",
                          GROVE_DOT_CLASS[grove.color]
                        )}
                        title={grove.name}
                      />
                    ) : (
                      <FileText
                        size={13}
                        className={cn("shrink-0", isActive ? "text-green-800" : "text-ink-400")}
                      />
                    )}

                    {isEditing ? (
                      <input
                        autoFocus
                        value={editTitle}
                        maxLength={40}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleCommitRename}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCommitRename();
                          if (e.key === "Escape") {
                            e.stopPropagation();
                            setEditingId(null);
                          }
                        }}
                        className="min-w-0 flex-1 bg-transparent text-inherit outline-none"
                      />
                    ) : (
                      <span className="min-w-0 flex-1 truncate">{map.title}</span>
                    )}

                    {isEditing ? null : (
                      <>
                        <span
                          className={cn(
                            "shrink-0 items-center gap-1",
                            isConfirming ? "flex" : "hidden group-hover:flex"
                          )}
                        >
                          {!isConfirming && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartRename(map.id, map.title);
                              }}
                              className="rounded p-0.5 text-ink-500 hover:text-ink-900"
                              title="Rename"
                              aria-label={`Rename ${map.title}`}
                            >
                              <Edit3 size={12} />
                            </button>
                          )}
                          {sortedMaps.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => handleDelete(e, map.id)}
                              className={cn(
                                "flex items-center gap-1 rounded p-0.5 transition-colors",
                                isConfirming
                                  ? "bg-clay-bg px-1.5 text-clay-text"
                                  : "text-ink-500 hover:text-clay-500"
                              )}
                              title={isConfirming ? "Click again to delete" : "Delete map"}
                              aria-label={
                                isConfirming
                                  ? `Confirm delete ${map.title}`
                                  : `Delete ${map.title}`
                              }
                            >
                              {isConfirming ? (
                                <>
                                  <Check size={12} />
                                  <span className="text-[10px] font-semibold">Sure?</span>
                                </>
                              ) : (
                                <Trash2 size={12} />
                              )}
                            </button>
                          )}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 font-mono text-[10px] text-ink-400",
                            isConfirming ? "hidden" : "group-hover:hidden"
                          )}
                        >
                          {nodeCount} {nodeCount === 1 ? "idea" : "ideas"}
                        </span>
                        {isActive && !isConfirming && (
                          <Check size={13} className="shrink-0 text-green-800 group-hover:hidden" />
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* File the active map into a grove. */}
            {groves.length > 0 && (
              <div className="flex items-center gap-2 border-t border-line-soft px-4 py-2.5">
                <span className="text-[11px] text-ink-500">Grove</span>
                <select
                  value={activeMap?.groveId ?? ""}
                  onChange={(e) => assignMapToGrove(activeMapId, e.target.value || undefined)}
                  className="h-7 min-w-0 flex-1 rounded-full border border-line-hair bg-card px-2 text-[12px] text-ink-700 focus:outline-none"
                  aria-label="Assign this map to a grove"
                >
                  <option value="">None</option>
                  {groves.map((grove) => (
                    <option key={grove.id} value={grove.id}>
                      {grove.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="border-t border-line-soft p-1.5">
              <button
                type="button"
                onClick={handleCreate}
                className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] font-medium text-ink-700 transition-colors hover:bg-sunken hover:text-ink-900"
              >
                <Plus size={13} className="shrink-0 text-emerald-600" />
                New mind map
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

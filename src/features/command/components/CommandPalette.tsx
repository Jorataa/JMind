"use client";

import { useState, useEffect, useCallback, useMemo, useRef, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, LayoutDashboard, CheckSquare, Target, Network, Zap, RefreshCw, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGlobalSearch } from "../../search/hooks/use-global-search";
import { useTaskActions } from "@/stores/use-task-store";
import { useKPIStore, useKPIActions } from "@/stores/use-kpi-store";
import { useMindMapActions, useMindMapStore } from "@/stores/use-mindmap-store";
import { useFocus, useFocusActions } from "@/stores/use-focus-store";
import { useToast } from "@/stores/use-toast-store";
import { useUIActions, useUIStore } from "@/stores/use-ui-store";
import { cn } from "@/lib/cn";

interface PaletteItem {
  id: string;
  section: string;
  icon: ReactNode;
  label: string;
  run: () => void;
}

export default function CommandPalette() {
  const isOpen = useUIStore((state) => state.commandPaletteOpen);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchResults = useGlobalSearch(query);
  const { addTask } = useTaskActions();
  const kpis = useKPIStore((state) => state.kpis);
  const { updateProgress } = useKPIActions();
  const maps = useMindMapStore((state) => state.maps);
  const activeMapId = useMindMapStore((state) => state.activeMapId);
  const { requestNodeFocus, createMap, switchMap } = useMindMapActions();
  const { deepWorkMode } = useFocus();
  const { setDeepWorkMode, resetDaily } = useFocusActions();
  const { setCommandPaletteOpen, toggleCommandPalette } = useUIActions();
  const addToast = useToast();

  const closePalette = useCallback(() => {
    setCommandPaletteOpen(false);
    setQuery("");
    setHighlight(0);
  }, [setCommandPaletteOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleCommandPalette();
        if (isOpen) setQuery("");
      }
      if (e.key === "Escape" && isOpen) {
        closePalette();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closePalette, isOpen, toggleCommandPalette]);

  // One flat, ordered list drives both rendering and keyboard navigation, so
  // what you see is exactly what ↑/↓/Enter operate on.
  const items = useMemo<PaletteItem[]>(() => {
    const result: PaletteItem[] = [];

    if (!query) {
      result.push({
        id: "deep-work",
        section: "Quick Actions",
        icon: <Zap size={16} className="text-emerald-400" />,
        label: deepWorkMode ? "End Focus Session" : "Start Focus Session",
        run: () => {
          setDeepWorkMode(!deepWorkMode);
          addToast(`Focus session ${!deepWorkMode ? "started" : "ended"}`, "info");
        },
      });
      result.push({
        id: "daily-reset",
        section: "Quick Actions",
        icon: <RefreshCw size={16} className="text-sky-400" />,
        label: "Reset Today's Focus",
        run: () => {
          resetDaily();
          addToast("Focus reset for a new session", "info");
        },
      });
      result.push({
        id: "new-map",
        section: "Mind Maps",
        icon: <Plus size={16} className="text-violet-400" />,
        label: "New mind map",
        run: () => {
          createMap();
          router.push("/mindmap");
        },
      });
      Object.values(maps)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .filter((map) => map.id !== activeMapId)
        .slice(0, 4)
        .forEach((map) => {
          result.push({
            id: `map-${map.id}`,
            section: "Mind Maps",
            icon: <FileText size={16} className="text-violet-400" />,
            label: `Open ${map.title}`,
            run: () => {
              switchMap(map.id);
              router.push("/mindmap");
            },
          });
        });
      result.push(
        { id: "nav-dashboard", section: "Navigation", icon: <LayoutDashboard size={16} />, label: "Go to Dashboard", run: () => router.push("/dashboard") },
        { id: "nav-mindmap", section: "Navigation", icon: <Network size={16} />, label: "Go to Mind Map", run: () => router.push("/mindmap") },
        { id: "nav-tasks", section: "Navigation", icon: <CheckSquare size={16} />, label: "Go to Tasks", run: () => router.push("/tasks") },
        { id: "nav-kpi", section: "Navigation", icon: <Target size={16} />, label: "Go to KPIs", run: () => router.push("/kpi") },
      );
      kpis.slice(0, 3).forEach((kpi) => {
        result.push({
          id: `kpi-${kpi.id}`,
          section: "Increment Metrics",
          icon: <Target size={16} className="text-rose-400" />,
          label: `Add 1 to ${kpi.label}`,
          run: () => {
            updateProgress(kpi.id, kpi.value + 1);
            addToast("Metric updated", "success");
          },
        });
      });
      return result;
    }

    result.push({
      id: "create-task",
      section: "Actions",
      icon: <Plus size={16} className="text-emerald-400" />,
      label: `Create task: "${query}"`,
      run: () => {
        addTask(query.trim(), "medium", "quick");
        addToast(`Task created: ${query.trim()}`, "success");
      },
    });
    const q = query.trim().toLowerCase();
    Object.values(maps)
      .filter((map) => map.title.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((map) => {
        result.push({
          id: `map-${map.id}`,
          section: "Mind Maps",
          icon: <FileText size={16} className="text-violet-400" />,
          label: map.id === activeMapId ? `${map.title} — current map` : `Open ${map.title}`,
          run: () => {
            if (map.id !== activeMapId) switchMap(map.id);
            router.push("/mindmap");
          },
        });
      });
    searchResults.nodes.forEach(({ node, mapId, mapTitle }) => {
      result.push({
        // Root nodes share the id "root" across maps — namespace by map.
        id: `node-${mapId}-${node.id}`,
        section: "Ideas",
        icon: <Network size={16} />,
        label: mapId === activeMapId ? node.data.label : `${node.data.label} · ${mapTitle}`,
        run: () => {
          // Switch first so the focus request selects in the right map.
          if (mapId !== activeMapId) switchMap(mapId);
          requestNodeFocus(node.id);
          router.push("/mindmap");
        },
      });
    });
    searchResults.tasks.forEach((task) => {
      result.push({
        id: `task-${task.id}`,
        section: "Tasks",
        icon: <CheckSquare size={16} />,
        label: task.title,
        run: () => router.push("/tasks"),
      });
    });
    searchResults.kpis.forEach((kpi) => {
      result.push({
        id: `kpi-${kpi.id}`,
        section: "KPIs",
        icon: <Target size={16} />,
        label: kpi.label,
        run: () => router.push("/kpi"),
      });
    });

    return result;
  }, [query, deepWorkMode, kpis, maps, activeMapId, searchResults, addTask, addToast, createMap, resetDaily, router, requestNodeFocus, setDeepWorkMode, switchMap, updateProgress]);

  // Highlight resets via event handlers (typing, closing); clamping here
  // covers the list shrinking while open.
  const safeHighlight = items.length > 0 ? Math.min(highlight, items.length - 1) : 0;

  const runItem = useCallback(
    (item: PaletteItem) => {
      item.run();
      closePalette();
    },
    [closePalette]
  );

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (items.length === 0) return;
      const delta = e.key === "ArrowDown" ? 1 : -1;
      const next = (safeHighlight + delta + items.length) % items.length;
      setHighlight(next);
      listRef.current
        ?.querySelector(`[data-index="${next}"]`)
        ?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[safeHighlight];
      if (item) runItem(item);
    }
  };

  // Group consecutive items by section for rendering.
  const sections = useMemo(() => {
    const grouped: { section: string; items: { item: PaletteItem; index: number }[] }[] = [];
    items.forEach((item, index) => {
      const last = grouped[grouped.length - 1];
      if (last && last.section === item.section) {
        last.items.push({ item, index });
      } else {
        grouped.push({ section: item.section, items: [{ item, index }] });
      }
    });
    return grouped;
  }, [items]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePalette}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed left-1/2 top-[20%] z-[120] w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/90 shadow-2xl shadow-black/50 backdrop-blur-2xl"
          >
            <div className="flex items-center gap-3 border-b border-white/10 p-4">
              <Search size={18} className="text-zinc-500" />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlight(0);
                }}
                onKeyDown={onInputKeyDown}
                placeholder="Search anything or type a command..."
                className="flex-1 bg-transparent text-[15px] text-zinc-100 outline-none placeholder:text-zinc-600"
              />
              <div className="flex items-center gap-1 rounded-md border border-white/5 bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-bold text-zinc-500">
                <span className="text-[8px]">ESC</span>
              </div>
            </div>

            <div ref={listRef} className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
              {items.length === 0 ? (
                <p className="px-3 py-8 text-center text-[13px] text-zinc-600">
                  Nothing found. Keep typing to create a task.
                </p>
              ) : (
                <div className="flex flex-col gap-4 p-2">
                  {sections.map((group) => (
                    <div key={group.section} className="flex flex-col gap-1">
                      <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                        {group.section}
                      </p>
                      {group.items.map(({ item, index }) => (
                        <CommandItem
                          key={item.id}
                          icon={item.icon}
                          label={item.label}
                          index={index}
                          active={index === safeHighlight}
                          onHover={() => setHighlight(index)}
                          onClick={() => runItem(item)}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/5 bg-black/20 px-4 py-3">
              <div className="flex items-center gap-4">
                <Helper hint="Navigate" keys={["↑", "↓"]} />
                <Helper hint="Select" keys={["ENTER"]} />
              </div>
              <p className="text-[11px] font-medium italic text-zinc-600">Jorata Command Center</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CommandItem({
  icon,
  label,
  index,
  active,
  onHover,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  index: number;
  active: boolean;
  onHover: () => void;
  onClick: () => void;
}) {
  return (
    <button
      data-index={index}
      onClick={onClick}
      onMouseEnter={onHover}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-zinc-300 transition-colors active:scale-[0.98]",
        active ? "bg-white/[0.07] text-zinc-50" : "hover:bg-white/[0.05]"
      )}
    >
      <span className="text-zinc-500">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {active && (
        <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-zinc-500">
          ↵
        </kbd>
      )}
    </button>
  );
}

function Helper({ hint, keys }: { hint: string; keys: string[] }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-zinc-600">{hint}</span>
      <div className="flex gap-1">
        {keys.map(k => (
          <span key={k} className="flex min-w-[16px] items-center justify-center rounded border border-white/10 bg-white/[0.03] px-1 text-[9px] font-bold text-zinc-500">{k}</span>
        ))}
      </div>
    </div>
  );
}

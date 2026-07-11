"use client";

import { useState, useEffect, useCallback, useMemo, useRef, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, LayoutDashboard, CheckSquare, Target, Network, Zap, RefreshCw, FileText, Sparkles, BookOpen, Calendar, Inbox, StickyNote } from "lucide-react";
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
  const { setCommandPaletteOpen, toggleCommandPalette, openAssistant } = useUIActions();
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
        { id: "nav-mindmap", section: "Navigation", icon: <Network size={16} />, label: "Go to Workspace", run: () => router.push("/mindmap") },
        { id: "nav-notes", section: "Navigation", icon: <FileText size={16} />, label: "Go to Notes", run: () => router.push("/notes") },
        { id: "nav-knowledge", section: "Navigation", icon: <BookOpen size={16} />, label: "Go to Knowledge", run: () => router.push("/knowledge") },
        { id: "nav-tasks", section: "Navigation", icon: <CheckSquare size={16} />, label: "Go to Tasks", run: () => router.push("/tasks") },
        { id: "nav-calendar", section: "Navigation", icon: <Calendar size={16} />, label: "Go to Calendar", run: () => router.push("/calendar") },
        { id: "nav-kpi", section: "Navigation", icon: <Target size={16} />, label: "Go to Goals", run: () => router.push("/kpi") },
        { id: "nav-inbox", section: "Navigation", icon: <Inbox size={16} />, label: "Go to Inbox", run: () => router.push("/inbox") },
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
      icon: <Plus size={16} className="text-emerald-600" />,
      label: `Create task: "${query}"`,
      run: () => {
        addTask(query.trim(), "medium", "quick");
        addToast(`Task created: ${query.trim()}`, "success");
      },
    });
    result.push({
      id: "ask-ai",
      section: "Actions",
      icon: <Sparkles size={16} className="text-emerald-600" />,
      label: `Ask Jorata: "${query}"`,
      run: () => openAssistant(query.trim()),
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
    searchResults.notes.forEach((note) => {
      result.push({
        id: `note-${note.id}`,
        section: "Notes",
        icon: <StickyNote size={16} />,
        label: note.title || note.body.slice(0, 40) || "Untitled note",
        run: () => router.push("/notes"),
      });
    });
    searchResults.sources.forEach((source) => {
      result.push({
        id: `source-${source.id}`,
        section: "Knowledge",
        icon: <BookOpen size={16} />,
        label: source.title,
        run: () => router.push("/knowledge"),
      });
    });
    searchResults.kpis.forEach((kpi) => {
      result.push({
        id: `kpi-${kpi.id}`,
        section: "Goals",
        icon: <Target size={16} />,
        label: kpi.label,
        run: () => router.push("/kpi"),
      });
    });

    return result;
  }, [query, deepWorkMode, kpis, maps, activeMapId, searchResults, addTask, addToast, createMap, openAssistant, resetDaily, router, requestNodeFocus, setDeepWorkMode, switchMap, updateProgress]);

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
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      // ⌘⏎ hands the query to the Assistant (§6.10 footer hint).
      e.preventDefault();
      if (query.trim()) {
        openAssistant(query.trim());
        closePalette();
      }
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
            className="fixed inset-0 z-[110] bg-[rgba(27,41,31,0.32)] backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, scale: 0.97, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -12 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="fixed left-1/2 top-[18vh] z-[120] w-full max-w-[640px] -translate-x-1/2 overflow-hidden rounded-[16px] border border-line-hair bg-card shadow-float-3"
          >
            <div className="flex items-center gap-3 border-b border-line-soft px-4 py-3.5">
              <Search size={16} className="text-ink-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlight(0);
                }}
                onKeyDown={onInputKeyDown}
                placeholder="Find, create, or ask anything"
                className="flex-1 bg-transparent text-[15.5px] text-ink-900 outline-none placeholder:font-serif placeholder:italic placeholder:text-ink-400"
              />
              <kbd className="rounded-kbd border border-line-hair bg-sunken px-1.5 py-0.5 font-mono text-[10px] text-ink-500">
                esc
              </kbd>
            </div>

            <div ref={listRef} className="custom-scrollbar max-h-[400px] overflow-y-auto p-2">
              {items.length === 0 ? (
                <p className="px-3 py-8 text-center font-serif text-[14px] italic text-ink-500">
                  Nothing found — ⏎ creates a task, ⌘⏎ asks Jorata.
                </p>
              ) : (
                <div className="flex flex-col gap-3 p-1">
                  {sections.map((group) => (
                    <div key={group.section} className="flex flex-col gap-0.5">
                      <p className="px-3 pb-1 pt-1.5 text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
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

            <div className="flex items-center justify-center border-t border-line-soft bg-paper px-4 py-2.5">
              <p className="font-mono text-[10.5px] text-ink-500">
                ↑↓ navigate · ⏎ open · ⌘⏎ ask AI
              </p>
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
        "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[13.5px] font-medium transition-colors",
        active ? "bg-sage-surface text-ink-900" : "text-ink-700 hover:bg-sunken"
      )}
    >
      <span className={active ? "text-green-800" : "text-ink-500"}>{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {active && (
        <kbd className="rounded-kbd border border-sage-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-ink-500">
          ⏎
        </kbd>
      )}
    </button>
  );
}

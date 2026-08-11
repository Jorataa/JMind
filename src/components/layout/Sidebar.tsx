"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useUIStore, useUIActions, useUserName } from "@/stores/use-ui-store";
import { useMindMapStore } from "@/stores/use-mindmap-store";
import { useTaskStore } from "@/stores/use-task-store";
import {
  useGroveStore,
  GROVE_DOT_CLASS,
  type Grove,
} from "@/stores/use-grove-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { useShallow } from "zustand/shallow";
import { cn } from "@/lib/cn";
import { LogoMark } from "@/components/ui/Logo";
import { ContourRings } from "@/components/ui/ContourArt";
import SyncStatusChip from "./SyncStatusChip";
import { NotificationBell } from "@/features/notifications/NotificationBell";
import {
  LayoutDashboard,
  Waypoints,
  FileText,
  BookOpen,
  CheckSquare,
  Calendar,
  Target,
  Search,
  Plus,
  X,
  PanelLeft,
  Pencil,
  Trash2,
  Check,
} from "lucide-react";

/**
 * The rail (design handoff §6.1) — the one shell every authenticated page
 * shares. 232px evergreen; collapses to 64px on the Workspace (and by user
 * preference elsewhere). On mobile it slides in as a drawer until the bottom
 * tab bar takes over (<768px, §10).
 */

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { id: "workspace", label: "Workspace", href: "/mindmap", icon: Waypoints },
  { id: "notes", label: "Notes", href: "/notes", icon: FileText },
  { id: "knowledge", label: "Knowledge", href: "/knowledge", icon: BookOpen },
  { id: "tasks", label: "Tasks", href: "/tasks", icon: CheckSquare },
  { id: "calendar", label: "Calendar", href: "/calendar", icon: Calendar },
  { id: "goals", label: "Goals", href: "/kpi", icon: Target },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const mobileSidebarOpen = useUIStore((state) => state.mobileSidebarOpen);
  const userName = useUserName();
  const {
    toggleSidebar,
    setMobileSidebarOpen,
    setCommandPaletteOpen,
    setQuickCaptureOpen,
  } = useUIActions();

  // The Workspace is a focus context: the rail always recedes to 64px there.
  const isWorkspace = pathname.startsWith("/mindmap");
  const isCompact = (sidebarCollapsed || isWorkspace) && !mobileSidebarOpen;

  const { maps, activeMapId, switchMap, assignMapToGrove } = useMindMapStore(
    useShallow((state) => ({
      maps: state.maps,
      activeMapId: state.activeMapId,
      switchMap: state.actions.switchMap,
      assignMapToGrove: state.actions.assignMapToGrove,
    }))
  );

  const groves = useGroveStore((state) => state.groves);
  const { addGrove, renameGrove, removeGrove } = useGroveStore(
    (state) => state.actions
  );

  // Attention count: open tasks that are due today or overdue.
  const dueCount = useTaskStore((state) => {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return state.tasks.filter(
      (t) => !t.completed && t.dueDate && new Date(t.dueDate) <= endOfToday
    ).length;
  });

  /* One-time adoption: existing users have maps but no groves yet. Group
     everything under a starter grove so the rail is truthful from day one —
     nothing is deleted or renamed, maps just gain a groveId. */
  const adopted = useRef(false);
  useEffect(() => {
    if (!hydrated || adopted.current) return;
    adopted.current = true;
    const mapList = Object.values(useMindMapStore.getState().maps);
    const grovesNow = useGroveStore.getState().groves;
    if (grovesNow.length === 0 && mapList.length > 0) {
      const grove = useGroveStore.getState().actions.addGrove("My maps", "emerald");
      mapList.forEach((map) => {
        if (!map.groveId) assignMapToGrove(map.id, grove.id);
      });
    }
  }, [hydrated, assignMapToGrove]);

  const [editingGroveId, setEditingGroveId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Disarm the delete confirmation if the user walks away.
  useEffect(() => {
    if (!confirmDeleteId) return;
    const timer = window.setTimeout(() => setConfirmDeleteId(null), 3000);
    return () => window.clearTimeout(timer);
  }, [confirmDeleteId]);

  const mapList = Object.values(maps);
  const ungroupedMaps = hydrated
    ? mapList
        .filter((m) => !m.groveId || !groves.some((g) => g.id === m.groveId))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    : [];

  // Opening a grove lands on its most recently touched map.
  const handleOpenGrove = (grove: Grove) => {
    const groveMaps = mapList
      .filter((m) => m.groveId === grove.id)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (groveMaps.length > 0 && groveMaps[0].id !== activeMapId) {
      switchMap(groveMaps[0].id);
    }
    setMobileSidebarOpen(false);
    if (!isWorkspace) router.push("/mindmap");
  };

  const handleOpenMap = (id: string) => {
    if (id !== activeMapId) switchMap(id);
    setMobileSidebarOpen(false);
    if (!isWorkspace) router.push("/mindmap");
  };

  const handleAddGrove = () => {
    const grove = addGrove("New grove");
    setEditingGroveId(grove.id);
    setEditName(grove.name);
  };

  const handleCommitRename = () => {
    if (editingGroveId && editName.trim()) {
      renameGrove(editingGroveId, editName);
    }
    setEditingGroveId(null);
  };

  const handleDeleteGrove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setConfirmDeleteId(null);
    // Maps in the grove are NOT deleted — they simply become ungrouped.
    removeGrove(id);
  };

  const openCapture = () => {
    setMobileSidebarOpen(false);
    setQuickCaptureOpen(true);
  };

  return (
    <>
      {/* Mobile scrim */}
      <button
        type="button"
        className={cn(
          "fixed inset-0 z-[80] bg-[rgba(27,41,31,0.32)] backdrop-blur-[2px] transition-opacity md:hidden",
          mobileSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileSidebarOpen(false)}
        aria-label="Close navigation"
        tabIndex={mobileSidebarOpen ? 0 : -1}
      />

      <nav
        aria-label="Primary"
        className={cn(
          "fixed inset-y-0 left-0 z-[90] flex h-full flex-col overflow-hidden bg-evergreen-950 transition-all duration-300 md:relative md:z-auto",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        style={{ width: isCompact ? 64 : 232, minWidth: isCompact ? 64 : 232 }}
      >
        {/* Contour artwork, cropped bottom-left (§6.1) */}
        <ContourRings
          variant="dark"
          size={230}
          className="absolute -bottom-14 -left-16 z-0 opacity-50"
        />

        {/* ── Logo row ── */}
        <div
          className={cn(
            "relative z-10 flex items-center pt-5 pb-4",
            isCompact ? "justify-center px-0" : "gap-2.5 px-5"
          )}
        >
          <LogoMark size={27} className="shrink-0 text-emerald-500" title="Jorata" />
          {!isCompact && (
            <span className="font-serif text-[21px] leading-none text-rail-bright">
              Jorata
            </span>
          )}
          
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            {/* Mobile close */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-rail-muted hover:text-rail-bright md:hidden"
              aria-label="Close navigation"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Search well ── */}
        <div className={cn("relative z-10", isCompact ? "px-3" : "px-4")}>
          <button
            type="button"
            onClick={() => {
              setMobileSidebarOpen(false);
              setCommandPaletteOpen(true);
            }}
            className={cn(
              "flex items-center rounded-[11px] border border-[rgba(233,237,224,0.13)] bg-[rgba(233,237,224,0.09)] text-rail-muted transition-colors hover:border-[rgba(233,237,224,0.25)] hover:text-rail-text",
              isCompact ? "h-10 w-10 justify-center" : "h-9 w-full gap-2 px-3"
            )}
            aria-label="Search — opens the command palette"
            title={isCompact ? "Search (⌘K)" : undefined}
          >
            <Search size={15} className="shrink-0" />
            {!isCompact && (
              <>
                <span className="flex-1 text-left text-[13px]">Search</span>
                <kbd className="font-mono text-[10.5px] tracking-wide text-rail-faint">
                  ⌘K
                </kbd>
              </>
            )}
          </button>
        </div>

        {/* ── Nav ── */}
        <div
          className={cn(
            "scrollbar-on-dark relative z-10 mt-4 flex-1 overflow-y-auto overflow-x-hidden pb-2",
            isCompact ? "px-3" : "px-4"
          )}
        >
          <ul className={cn("flex flex-col", isCompact ? "items-center gap-1" : "gap-[3px]")}>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.id} className={isCompact ? "" : "w-full"}>
                  <Link
                    href={item.href}
                    title={isCompact ? item.label : undefined}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={cn(
                      "flex items-center rounded-[10px] text-[13.5px] transition-colors duration-100",
                      isCompact
                        ? "h-10 w-10 justify-center rounded-[11px]"
                        : "gap-2.5 px-3 py-[9px]",
                      isActive
                        ? "bg-sage-surface font-semibold text-evergreen-950"
                        : "text-rail-text hover:bg-[rgba(233,237,224,0.07)]"
                    )}
                  >
                    <Icon size={isCompact ? 19 : 16} strokeWidth={1.9} className="shrink-0" />
                    {!isCompact && <span className="truncate">{item.label}</span>}
                    {!isCompact && item.id === "tasks" && hydrated && dueCount > 0 && (
                      <span className="ml-auto font-mono text-[11px] text-ochre-500">
                        {dueCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* ── Groves ── */}
          {!isCompact && (
            <div className="mt-6">
              <div className="mb-1.5 flex items-center justify-between px-3">
                <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-rail-faint">
                  Groves
                </p>
                <button
                  type="button"
                  onClick={handleAddGrove}
                  className="rounded p-0.5 text-rail-faint transition-colors hover:text-rail-text"
                  title="New grove"
                  aria-label="Create a new grove"
                >
                  <Plus size={13} />
                </button>
              </div>

              <ul className="flex flex-col gap-[2px]">
                {hydrated &&
                  groves.map((grove) => {
                    const isEditing = editingGroveId === grove.id;
                    const isConfirming = confirmDeleteId === grove.id;
                    return (
                      <li key={grove.id} className="group">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => !isEditing && handleOpenGrove(grove)}
                          onKeyDown={(e) => {
                            if (!isEditing && (e.key === "Enter" || e.key === " ")) {
                              e.preventDefault();
                              handleOpenGrove(grove);
                            }
                          }}
                          className="flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13px] text-rail-muted transition-colors duration-100 hover:bg-[rgba(233,237,224,0.07)] hover:text-rail-text"
                        >
                          <span
                            className={cn(
                              "h-[7px] w-[7px] shrink-0 rounded-[3px]",
                              GROVE_DOT_CLASS[grove.color]
                            )}
                          />
                          {isEditing ? (
                            <input
                              autoFocus
                              value={editName}
                              maxLength={32}
                              onChange={(e) => setEditName(e.target.value)}
                              onBlur={handleCommitRename}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleCommitRename();
                                if (e.key === "Escape") {
                                  e.stopPropagation();
                                  setEditingGroveId(null);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full bg-transparent text-rail-bright outline-none"
                            />
                          ) : (
                            <span className="flex-1 truncate">{grove.name}</span>
                          )}

                          {!isEditing && (
                            <span
                              className={cn(
                                "items-center gap-0.5",
                                isConfirming ? "flex" : "hidden group-hover:flex"
                              )}
                            >
                              {!isConfirming && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingGroveId(grove.id);
                                    setEditName(grove.name);
                                  }}
                                  className="rounded p-0.5 text-rail-faint hover:text-rail-text"
                                  aria-label={`Rename ${grove.name}`}
                                >
                                  <Pencil size={11.5} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => handleDeleteGrove(e, grove.id)}
                                className={cn(
                                  "flex items-center gap-1 rounded p-0.5 transition-colors",
                                  isConfirming
                                    ? "bg-clay-bg/20 px-1 text-clay-500"
                                    : "text-rail-faint hover:text-clay-500"
                                )}
                                title={
                                  isConfirming
                                    ? "Click again — maps are kept, only the group goes"
                                    : "Delete grove (keeps its maps)"
                                }
                                aria-label={
                                  isConfirming
                                    ? `Confirm delete ${grove.name}`
                                    : `Delete ${grove.name}`
                                }
                              >
                                {isConfirming ? <Check size={11.5} /> : <Trash2 size={11.5} />}
                              </button>
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}

                {/* Maps that belong to no grove stay reachable from the rail. */}
                {ungroupedMaps.map((map) => (
                  <li key={map.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenMap(map.id)}
                      className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13px] text-rail-faint transition-colors duration-100 hover:bg-[rgba(233,237,224,0.07)] hover:text-rail-text"
                    >
                      <span className="h-[7px] w-[7px] shrink-0 rounded-[3px] bg-sage-500/60" />
                      <span className="flex-1 truncate text-left">{map.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── New thought + avatar ── */}
        <div
          className={cn(
            "relative z-10 flex flex-col pb-4",
            isCompact ? "items-center gap-2 px-3" : "gap-2 px-4"
          )}
        >
          <button
            type="button"
            onClick={openCapture}
            className={cn(
              "flex items-center bg-emerald-500 font-semibold text-white transition-colors hover:bg-emerald-600",
              isCompact
                ? "h-10 w-10 justify-center rounded-[11px]"
                : "h-9 w-full justify-between rounded-[11px] px-3 text-[13px]"
            )}
            title={isCompact ? "New thought (N)" : undefined}
          >
            {isCompact ? (
              <Plus size={17} />
            ) : (
              <>
                <span className="flex items-center gap-2">
                  <Plus size={15} />
                  New thought
                </span>
                <kbd className="font-mono text-[10.5px] font-normal opacity-80">N</kbd>
              </>
            )}
          </button>

          {/* Collapse preference — hidden on the Workspace where compact is forced. */}
          {!isWorkspace && (
            <button
              type="button"
              onClick={toggleSidebar}
              className={cn(
                "hidden items-center gap-2 rounded-[10px] text-rail-faint transition-colors hover:text-rail-text md:flex",
                isCompact ? "h-8 w-10 justify-center" : "h-7 px-3 text-[11px]"
              )}
              aria-label={isCompact ? "Expand sidebar" : "Collapse sidebar"}
              title={isCompact ? "Expand" : "Collapse"}
            >
              <PanelLeft size={13} />
              {!isCompact && <span>Collapse</span>}
            </button>
          )}

          {/* Where the data lives — always answerable at a glance (§ pass 2). */}
          <SyncStatusChip compact={isCompact} />

          <Link
            href="/settings"
            onClick={() => setMobileSidebarOpen(false)}
            className={cn(
              "flex items-center rounded-[11px] transition-colors hover:bg-[rgba(233,237,224,0.07)]",
              isCompact ? "h-10 w-10 justify-center" : "gap-2.5 px-2 py-2"
            )}
            title={isCompact ? "Settings & profile" : undefined}
          >
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-ochre-500 text-[12px] font-semibold text-evergreen-950">
              {(userName || "Y").charAt(0).toUpperCase()}
            </span>
            {!isCompact && (
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[12.5px] font-medium text-rail-bright">
                  {userName || "You"}
                </span>
                <span className="text-[10.5px] leading-tight text-rail-faint">
                  Free — everything included
                </span>
              </span>
            )}
          </Link>
        </div>
      </nav>
    </>
  );
}

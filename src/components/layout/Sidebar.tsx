"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUIStore, useUIActions, useUserName } from "@/stores/use-ui-store";
import { useMindMapStore } from "@/stores/use-mindmap-store";
import { useShallow } from "zustand/shallow";
import { cn } from "@/lib/cn";
import { X, Plus, Trash2, Edit3, FileText, Check } from "lucide-react";

type NavItem = {
  label: string;
  icon: React.ReactNode;
  id: string;
  href: string;
};

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "mindmaps",
    label: "Mind Maps",
    href: "/mindmap",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="8" cy="8" r="2.5" fill="currentColor" />
        <circle cx="2.5" cy="3" r="1.5" fill="currentColor" />
        <circle cx="13.5" cy="3" r="1.5" fill="currentColor" />
        <circle cx="2.5" cy="13" r="1.5" fill="currentColor" />
        <circle cx="13.5" cy="13" r="1.5" fill="currentColor" />
        <line
          x1="5.5"
          y1="6.5"
          x2="3.5"
          y2="4.2"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <line
          x1="10.5"
          y1="6.5"
          x2="12.5"
          y2="4.2"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <line
          x1="5.5"
          y1="9.5"
          x2="3.5"
          y2="11.8"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <line
          x1="10.5"
          y1="9.5"
          x2="12.5"
          y2="11.8"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "tasks",
    label: "Tasks",
    href: "/tasks",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="1"
          y="1"
          width="14"
          height="14"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M5 8L7 10L11 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "kpi",
    label: "KPI",
    href: "/kpi",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polyline
          points="1,12 5,7 8,9 12,4 15,6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="15" cy="6" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 1V2.5M8 13.5V15M1 8H2.5M13.5 8H15M3.05 3.05L4.11 4.11M11.89 11.89L12.95 12.95M3.05 12.95L4.11 11.89M11.89 4.11L12.95 3.05"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const mobileSidebarOpen = useUIStore((state) => state.mobileSidebarOpen);
  const userName = useUserName();
  const { toggleSidebar, setMobileSidebarOpen } = useUIActions();
  const isCompact = sidebarCollapsed && !mobileSidebarOpen;

  const { maps, activeMapId, createMap, switchMap, deleteMap, renameMap } = useMindMapStore(
    useShallow((state) => ({
      maps: state.maps,
      activeMapId: state.activeMapId,
      createMap: state.actions.createMap,
      switchMap: state.actions.switchMap,
      deleteMap: state.actions.deleteMap,
      renameMap: state.actions.renameMap,
    }))
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Disarm the delete confirmation if the user walks away.
  useEffect(() => {
    if (!confirmDeleteId) return;
    const timer = window.setTimeout(() => setConfirmDeleteId(null), 3000);
    return () => window.clearTimeout(timer);
  }, [confirmDeleteId]);

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

  const handleCancelRename = () => {
    setEditingId(null);
  };

  // Opening a map always lands you on the canvas; switching to the map you're
  // already in must not reset selection or undo history.
  const handleOpenMap = (id: string) => {
    if (id !== activeMapId) {
      switchMap(id);
    }
    setMobileSidebarOpen(false);
    if (!pathname.startsWith("/mindmap")) {
      router.push("/mindmap");
    }
  };

  const handleCreateMap = () => {
    createMap();
    setMobileSidebarOpen(false);
    if (!pathname.startsWith("/mindmap")) {
      router.push("/mindmap");
    }
  };

  const handleDeleteMap = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (Object.keys(maps).length <= 1) return;

    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setConfirmDeleteId(null);
    deleteMap(id);
  };

  return (
    <>
      <button
        type="button"
        className={cn(
          "fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm transition-opacity md:hidden",
          mobileSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileSidebarOpen(false)}
        aria-label="Close navigation"
      />
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-[90] flex h-full flex-col border-r border-white/10 bg-zinc-950 transition-all duration-300 md:relative md:z-auto",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
      style={{ width: isCompact ? "64px" : "256px", minWidth: isCompact ? "64px" : "256px" }}
    >
      {/* Brand */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        {!isCompact && (
          <div className="flex flex-col gap-1">
            <span className="text-[15px] font-semibold tracking-tight text-zinc-50">
              Jorata
            </span>
            {/* The four-pillar loop, paired into its two halves — thinking, then
                doing — so it reads as intentional rather than an awkward wrap. */}
            <span className="text-[10px] font-medium uppercase leading-[1.5] tracking-[0.16em] text-zinc-500">
              Think · Plan
              <br />
              Execute · Measure
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          className={`hidden h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-zinc-500 transition-colors hover:text-zinc-200 md:flex ${isCompact ? "mx-auto" : ""}`}
          aria-label={isCompact ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d={isCompact ? "M4 2L8 6L4 10" : "M8 2L4 6L8 10"}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-500 transition-colors hover:text-zinc-200 md:hidden"
          aria-label="Close navigation"
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4 overflow-y-auto">
        {!isCompact && (
          <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            Workspace
          </p>
        )}
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              title={isCompact ? item.label : undefined}
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors duration-100 ${
                isActive
                  ? "bg-white/10 text-zinc-50"
                  : "text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200"
              } ${isCompact ? "justify-center px-0" : ""}`}
            >
              <span
                className={`flex-shrink-0 ${
                  isActive ? "text-emerald-300" : "text-zinc-600"
                }`}
              >
                {item.icon}
              </span>
              {!isCompact && item.label}
              {!isCompact && isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-300" />
              )}
            </Link>
          );
        })}

        {/* Mind Map Workspaces */}
        {!isCompact && (
          <>
            <div className="mt-6 mb-2 flex items-center justify-between px-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                Mind Maps
              </p>
              <button
                onClick={handleCreateMap}
                className="rounded p-0.5 text-zinc-600 hover:bg-white/5 hover:text-zinc-300"
                title="New mind map"
                aria-label="Create new mind map"
              >
                <Plus size={12} />
              </button>
            </div>
            <div className="flex flex-col gap-0.5">
              {/* Stable order (oldest first) — a list that reshuffles while
                  you work reads as chaos, not recency. */}
              {Object.values(maps).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((map) => {
                const isActive = activeMapId === map.id;
                const isEditing = editingId === map.id;
                const isConfirmingDelete = confirmDeleteId === map.id;

                return (
                  <div
                    key={map.id}
                    className={cn(
                      "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors duration-100 cursor-pointer",
                      isActive
                        ? "bg-emerald-500/10 text-emerald-50"
                        : "text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200"
                    )}
                    onClick={() => handleOpenMap(map.id)}
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleStartRename(map.id, map.title);
                    }}
                  >
                    <FileText size={14} className={isActive ? "text-emerald-400" : "text-zinc-600"} />
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editTitle}
                        maxLength={40}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleCommitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCommitRename();
                          if (e.key === "Escape") {
                            e.stopPropagation();
                            handleCancelRename();
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-transparent text-inherit outline-none"
                      />
                    ) : (
                      <span className="truncate flex-1">{map.title}</span>
                    )}

                    {!isEditing && (
                      <div className={cn(
                        "items-center gap-1",
                        isConfirmingDelete ? "flex" : "hidden group-hover:flex"
                      )}>
                        {!isConfirmingDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRename(map.id, map.title);
                            }}
                            className="rounded p-0.5 text-zinc-600 hover:text-zinc-300"
                            title="Rename"
                            aria-label={`Rename ${map.title}`}
                          >
                            <Edit3 size={12} />
                          </button>
                        )}
                        {Object.keys(maps).length > 1 && (
                          <button
                            onClick={(e) => handleDeleteMap(e, map.id)}
                            className={cn(
                              "flex items-center gap-1 rounded p-0.5 transition-colors",
                              isConfirmingDelete
                                ? "bg-rose-500/15 px-1.5 text-rose-400"
                                : "text-zinc-600 hover:text-rose-400"
                            )}
                            title={isConfirmingDelete ? "Click again to delete" : "Delete"}
                            aria-label={isConfirmingDelete ? `Confirm delete ${map.title}` : `Delete ${map.title}`}
                          >
                            {isConfirmingDelete ? (
                              <>
                                <Check size={12} />
                                <span className="text-[10px] font-bold">Sure?</span>
                              </>
                            ) : (
                              <Trash2 size={12} />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 px-3 py-4">
        <div className={`flex items-center gap-3 rounded-xl py-2.5 transition-colors duration-100 hover:bg-white/[0.05] ${isCompact ? "justify-center px-0" : "px-2.5"}`}>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-300 text-[12px] font-semibold text-zinc-950">
            {(userName || "Y").charAt(0).toUpperCase()}
          </div>
          {!isCompact && (
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-zinc-200">{userName || "You"}</span>
              <span className="text-[11px] text-zinc-500">Local workspace</span>
            </div>
          )}
        </div>
      </div>
    </aside>
    </>
  );
}

"use client";

import { useUIActions } from "@/stores/use-ui-store";
import { useMindMapStore } from "@/stores/use-mindmap-store";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  Search,
  Command as CommandIcon,
  Menu,
  ChevronRight
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { formatFullDate } from "@/lib/format-date";

const PAGE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  mindmap: "Mind Maps",
  tasks: "Tasks",
  kpi: "KPIs",
  settings: "Settings",
};

export default function Topbar() {
  const pathname = usePathname();
  const { setMobileSidebarOpen, setCommandPaletteOpen } = useUIActions();
  const hydrated = useHydrated();
  const activeMapTitle = useMindMapStore((state) => state.maps[state.activeMapId]?.title);

  // "Monday, June 8" — only computed after hydration. The server clock is UTC,
  // so rendering a local date during SSR mismatches the client and can briefly
  // show the wrong day; gating on `hydrated` keeps the date honest.
  const formattedDate = hydrated ? formatFullDate() : null;

  // Breadcrumb/Title logic — on the canvas the active map is the real
  // location, so it takes the emphasized leaf position.
  const segment = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  const pageTitle = PAGE_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
  const showMapCrumb = hydrated && segment === "mindmap" && Boolean(activeMapTitle);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-zinc-950/50 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-400"
          aria-label="Open navigation"
        >
          <Menu size={16} />
        </button>

        <div className="flex items-center gap-2 text-[13px] font-medium">
          <span className="text-zinc-500">Workspace</span>
          <ChevronRight size={14} className="text-zinc-700" />
          <span className={cn(showMapCrumb ? "text-zinc-500" : "text-zinc-200 font-semibold")}>
            {pageTitle}
          </span>
          {showMapCrumb && (
            <span className="hidden items-center gap-2 md:flex">
              <ChevronRight size={14} className="text-zinc-700" />
              <span className="max-w-[180px] truncate font-semibold text-zinc-200">
                {activeMapTitle}
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Date Display — width reserved so the date fading in after hydration
            never nudges the search box. */}
        <div className="hidden min-w-[150px] lg:flex flex-col items-end">
          <span
            className={cn(
              "text-[12px] font-semibold text-zinc-200 transition-opacity duration-500",
              formattedDate ? "opacity-100" : "opacity-0"
            )}
          >
            {formattedDate ?? " "}
          </span>
        </div>

        {/* Global Search Trigger */}
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="relative hidden h-9 w-64 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] pl-3 pr-2 text-left transition-all hover:border-emerald-500/30 hover:bg-white/[0.04] md:flex"
          aria-label="Open command palette"
        >
          <Search className="text-zinc-600" size={14} />
          <span className="flex-1 truncate text-[12px] text-zinc-500">
            Search ideas, tasks, KPIs&hellip;
          </span>
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-zinc-500">
            <CommandIcon size={8} />
            <span>K</span>
          </div>
        </button>
      </div>
    </header>
  );
}

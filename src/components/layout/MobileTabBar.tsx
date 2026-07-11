"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Waypoints, CheckSquare, Menu, Plus } from "lucide-react";
import { useUIActions } from "@/stores/use-ui-store";
import { cn } from "@/lib/cn";

/**
 * Mobile shell (§10): a bottom tab bar with the capture FAB at its center.
 * The full nav (Notes, Knowledge, Calendar, Goals, Inbox, Settings) stays a
 * tap away behind Menu → the rail drawer.
 */
const TABS = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/mindmap", label: "Workspace", Icon: Waypoints },
] as const;

const TABS_AFTER = [{ href: "/tasks", label: "Tasks", Icon: CheckSquare }] as const;

export default function MobileTabBar() {
  const pathname = usePathname();
  const { setQuickCaptureOpen, setMobileSidebarOpen } = useUIActions();

  return (
    <nav
      aria-label="Primary (mobile)"
      className="fixed inset-x-0 bottom-0 z-[70] flex items-stretch justify-around border-t border-line-hair bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_14px_rgba(20,48,36,0.06)] md:hidden"
    >
      {TABS.map((tab) => (
        <Tab key={tab.href} {...tab} active={pathname.startsWith(tab.href)} />
      ))}

      {/* Capture — the raised center action. */}
      <div className="relative w-[64px]">
        <button
          type="button"
          onClick={() => setQuickCaptureOpen(true)}
          className="absolute left-1/2 top-[-18px] flex h-[52px] w-[52px] -translate-x-1/2 items-center justify-center rounded-full bg-emerald-500 text-white shadow-float-2 transition-transform active:scale-95"
          aria-label="Capture a new thought"
        >
          <Plus size={22} strokeWidth={2.4} />
        </button>
      </div>

      {TABS_AFTER.map((tab) => (
        <Tab key={tab.href} {...tab} active={pathname.startsWith(tab.href)} />
      ))}

      <button
        type="button"
        onClick={() => setMobileSidebarOpen(true)}
        className="flex flex-1 flex-col items-center gap-0.5 py-2 text-ink-500 transition-colors hover:text-ink-900"
        aria-label="Open full navigation"
      >
        <Menu size={18} strokeWidth={1.9} />
        <span className="text-[10px]">Menu</span>
      </button>
    </nav>
  );
}

function Tab({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors",
        active ? "text-green-800" : "text-ink-500 hover:text-ink-900"
      )}
    >
      <Icon size={18} strokeWidth={active ? 2.1 : 1.9} />
      <span className={cn("text-[10px]", active && "font-semibold")}>{label}</span>
    </Link>
  );
}

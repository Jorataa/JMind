"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore, useUIActions } from "@/stores/use-ui-store";

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
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const { toggleSidebar } = useUIActions();

  return (
    <aside
      className="hidden h-full flex-col border-r border-white/10 bg-zinc-950 transition-all duration-300 md:flex"
      style={{ width: sidebarCollapsed ? "64px" : "256px", minWidth: sidebarCollapsed ? "64px" : "256px" }}
    >
      {/* Brand */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        {!sidebarCollapsed && (
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] font-semibold tracking-tight text-zinc-50">
              JMind
            </span>
            <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
              Think. Plan. Execute.
            </span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={`flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-zinc-500 transition-colors hover:text-zinc-200 ${sidebarCollapsed ? "mx-auto" : ""}`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d={sidebarCollapsed ? "M4 2L8 6L4 10" : "M8 2L4 6L8 10"}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
        {!sidebarCollapsed && (
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
              title={sidebarCollapsed ? item.label : undefined}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors duration-100 ${
                isActive
                  ? "bg-white/10 text-zinc-50"
                  : "text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200"
              } ${sidebarCollapsed ? "justify-center px-0" : ""}`}
            >
              <span
                className={`flex-shrink-0 ${
                  isActive ? "text-emerald-300" : "text-zinc-600"
                }`}
              >
                {item.icon}
              </span>
              {!sidebarCollapsed && item.label}
              {!sidebarCollapsed && isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-300" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 px-3 py-4">
        <div className={`flex items-center gap-3 rounded-xl py-2.5 transition-colors duration-100 hover:bg-white/[0.05] ${sidebarCollapsed ? "justify-center px-0" : "px-2.5"}`}>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-300 text-[12px] font-semibold text-zinc-950">
            J
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-zinc-200">Jovan</span>
              <span className="text-[11px] text-zinc-500">Builder Mode</span>
            </div>
          )}
          {!sidebarCollapsed && (
            <button className="ml-auto flex-shrink-0 text-zinc-600 transition-colors hover:text-zinc-300">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="7" cy="3" r="1" fill="currentColor" />
                <circle cx="7" cy="7" r="1" fill="currentColor" />
                <circle cx="7" cy="11" r="1" fill="currentColor" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

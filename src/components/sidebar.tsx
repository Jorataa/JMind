"use client";

import { useState } from "react";

type NavItem = {
  label: string;
  icon: React.ReactNode;
  id: string;
};

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
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
];

export default function Sidebar() {
  const [activeId, setActiveId] = useState<string>("dashboard");

  return (
    <aside
      className="hidden h-full flex-col border-r border-white/10 bg-zinc-950 md:flex"
      style={{ width: "256px", minWidth: "256px" }}
    >
      {/* Brand */}
      <div className="flex flex-col gap-0.5 border-b border-white/10 px-5 py-5">
        <span className="text-[15px] font-semibold tracking-tight text-zinc-50">
          JMind
        </span>
        <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
          Think. Plan. Execute.
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Workspace
        </p>
        {navItems.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveId(item.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors duration-100 ${
                isActive
                  ? "bg-white/10 text-zinc-50"
                  : "text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200"
              }`}
            >
              <span
                className={`flex-shrink-0 ${
                  isActive ? "text-emerald-300" : "text-zinc-600"
                }`}
              >
                {item.icon}
              </span>
              {item.label}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-300" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 px-3 py-4">
        <div className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors duration-100 hover:bg-white/[0.05]">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-300 text-[12px] font-semibold text-zinc-950">
            J
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-zinc-200">Jovan</span>
            <span className="text-[11px] text-zinc-500">Builder Mode</span>
          </div>
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
        </div>
      </div>
    </aside>
  );
}

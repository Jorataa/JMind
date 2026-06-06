"use client";

import { useMemo, useState } from "react";

export default function Topbar() {
  const [search, setSearch] = useState<string>("");
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }).format(new Date()),
    []
  );

  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-white/10 bg-zinc-950/90 px-4 backdrop-blur-xl sm:px-6">
      {/* Page title */}
      <div className="flex items-center gap-3">
        <h1 className="text-[14px] font-semibold text-zinc-100">Dashboard</h1>
        <span className="hidden h-4 w-px bg-white/10 sm:block" />
        <span className="hidden text-[12px] text-zinc-500 sm:block">
          {todayLabel}
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden items-center sm:flex">
          <span className="pointer-events-none absolute left-3 text-zinc-500">
            <svg
              width="13"
              height="13"
              viewBox="0 0 13 13"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="5.5"
                cy="5.5"
                r="4"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <line
                x1="8.5"
                y1="8.5"
                x2="12"
                y2="12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workspace..."
            className="h-8 w-56 rounded-lg border border-white/10 bg-white/[0.03] pl-8 pr-3 text-[13px] text-zinc-200 outline-none transition-all duration-150 placeholder:text-zinc-600 focus:border-white/20 focus:bg-white/[0.06] focus:ring-2 focus:ring-emerald-400/10"
          />
        </div>

        {/* Divider */}
        <span className="hidden h-5 w-px bg-white/10 sm:block" />

        {/* Notification bell */}
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-200">
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7.5 1.5A4 4 0 0 0 3.5 5.5V9L2 10.5V11.5H13V10.5L11.5 9V5.5A4 4 0 0 0 7.5 1.5Z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path
              d="M6 12C6 12.8284 6.67157 13.5 7.5 13.5C8.32843 13.5 9 12.8284 9 12"
              stroke="currentColor"
              strokeWidth="1.3"
            />
          </svg>
        </button>

        {/* Profile badge */}
        <button className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-300 text-[12px] font-semibold text-zinc-950 ring-2 ring-zinc-900 transition-opacity hover:opacity-90">
          J
        </button>
      </div>
    </header>
  );
}

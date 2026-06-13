"use client";

import { useTaskFilter, useTaskActions, type TaskPriority } from "@/stores/use-task-store";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

export default function TaskToolbar() {
  const filter = useTaskFilter();
  const { setFilter } = useTaskActions();

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
          <input
            type="text"
            value={filter.search}
            onChange={(e) => setFilter({ search: e.target.value })}
            placeholder="Search tasks or categories..."
            className="h-10 w-full rounded-xl border border-white/10 bg-zinc-950/50 pl-10 pr-4 text-[13px] text-zinc-100 outline-none transition-all placeholder:text-zinc-600 focus:border-emerald-400/30 focus:ring-2 focus:ring-emerald-400/5"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl p-1">
          <FilterButton 
            active={filter.status === "all"} 
            onClick={() => setFilter({ status: "all" })}
            label="All" 
          />
          <FilterButton 
            active={filter.status === "pending"} 
            onClick={() => setFilter({ status: "pending" })}
            label="Pending" 
          />
          <FilterButton 
            active={filter.status === "completed"} 
            onClick={() => setFilter({ status: "completed" })}
            label="Done" 
          />
        </div>

        <select
          value={filter.priority}
          onChange={(e) => setFilter({ priority: e.target.value as "all" | TaskPriority })}
          className="h-10 rounded-xl border border-white/10 bg-zinc-950/50 px-3 text-[11px] font-bold uppercase tracking-widest text-zinc-400 outline-none transition-all focus:border-emerald-400/30"
          aria-label="Filter tasks by priority"
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all",
        active ? "bg-emerald-400 text-zinc-950 shadow-[0_2px_10px_rgba(52,211,153,0.2)]" : "text-zinc-500 hover:text-zinc-300"
      )}
    >
      {label}
    </button>
  );
}

"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, LayoutDashboard, CheckSquare, Target, Network, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGlobalSearch } from "../../search/hooks/use-global-search";
import { useTaskActions } from "@/stores/use-task-store";
import { useToast } from "@/stores/use-toast-store";

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const searchResults = useGlobalSearch(query);
  const { addTask } = useTaskActions();
  const addToast = useToast();

  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, toggle]);

  const navigate = (href: string) => {
    router.push(href);
    setIsOpen(false);
    setQuery("");
  };

  const handleQuickTask = () => {
    if (!query.trim()) return;
    addTask(query, "medium", "quick");
    addToast(`Task created: ${query}`, "success");
    setIsOpen(false);
    setQuery("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
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
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search anything or type a command..."
                className="flex-1 bg-transparent text-[15px] text-zinc-100 outline-none placeholder:text-zinc-600"
                onKeyDown={(e) => e.key === "Enter" && handleQuickTask()}
              />
              <div className="flex items-center gap-1 rounded-md border border-white/5 bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-bold text-zinc-500">
                <span className="text-[8px]">ESC</span>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-2">
              {!query && (
                <div className="flex flex-col gap-1">
                  <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">Navigation</p>
                  <CommandItem icon={<LayoutDashboard size={16} />} label="Dashboard" onClick={() => navigate("/dashboard")} />
                  <CommandItem icon={<CheckSquare size={16} />} label="Tasks" onClick={() => navigate("/tasks")} />
                  <CommandItem icon={<Target size={16} />} label="KPIs" onClick={() => navigate("/kpi")} />
                  <CommandItem icon={<Network size={16} />} label="Mind Maps" onClick={() => navigate("/mindmap")} />
                  <CommandItem icon={<Settings size={16} />} label="Settings" onClick={() => navigate("/settings")} />
                </div>
              )}

              {query && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">Quick Actions</p>
                    <CommandItem 
                      icon={<Plus size={16} className="text-emerald-400" />} 
                      label={`Create task: "${query}"`} 
                      onClick={handleQuickTask} 
                    />
                  </div>

                  {searchResults.tasks.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">Tasks</p>
                      {searchResults.tasks.map(task => (
                        <CommandItem key={task.id} icon={<CheckSquare size={16} />} label={task.title} onClick={() => navigate("/tasks")} />
                      ))}
                    </div>
                  )}

                  {searchResults.kpis.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">KPIs</p>
                      {searchResults.kpis.map(kpi => (
                        <CommandItem key={kpi.id} icon={<Target size={16} />} label={kpi.label} onClick={() => navigate("/kpi")} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between border-t border-white/5 bg-black/20 px-4 py-3">
              <div className="flex items-center gap-4">
                <Helper hint="Navigate" keys={["↑", "↓"]} />
                <Helper hint="Select" keys={["ENTER"]} />
              </div>
              <p className="text-[11px] font-medium text-zinc-600 italic">JMind Intelligence Engine</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CommandItem({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-zinc-300 transition-all hover:bg-white/[0.05] hover:text-zinc-50 active:scale-[0.98]"
    >
      <span className="text-zinc-500">{icon}</span>
      {label}
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

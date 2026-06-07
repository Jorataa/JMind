"use client";

import { motion, AnimatePresence, type Transition } from "framer-motion";
import { X, Target, CheckSquare, Clock, Hash, AlignLeft } from "lucide-react";
import { useMindMapStore, useMindMapActions, useSelectedNode } from "@/stores/use-mindmap-store";
import type { NodePriority, NodeStatus } from "@/types/mindmap";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/cn";

const sidebarTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export default function NodeIntelligenceSidebar() {
  const isOpen = useMindMapStore((state) => state.sidebarOpen);
  const selectedNode = useSelectedNode();
  const { toggleSidebar, updateNodeData, updateNodeLabel } = useMindMapActions();

  if (!selectedNode) return null;

  const data = selectedNode.data;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={sidebarTransition}
          className="fixed right-0 top-14 bottom-0 z-50 w-full max-w-sm border-l border-white/10 bg-zinc-950/80 p-0 shadow-2xl backdrop-blur-2xl"
        >
          <div className="flex h-full flex-col">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  data.category === "goal" ? "bg-indigo-500" : 
                  data.category === "task" ? "bg-emerald-500" :
                  data.category === "idea" ? "bg-violet-500" :
                  data.category === "warning" ? "bg-rose-500" : "bg-zinc-500"
                )} />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Node Intelligence
                </span>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleSidebar(false)}>
                <X size={16} />
              </Button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <div className="flex flex-col gap-8">
                {/* Title & Description */}
                <div className="flex flex-col gap-4">
                  <input
                    value={data.label}
                    onChange={(e) => updateNodeLabel(selectedNode.id, e.target.value)}
                    className="bg-transparent text-[24px] font-bold text-zinc-50 outline-none placeholder:text-zinc-700"
                    placeholder="Node Title..."
                  />
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <AlignLeft size={14} />
                      <span className="text-[11px] font-bold uppercase tracking-widest">Description</span>
                    </div>
                    <textarea
                      value={data.description || ""}
                      onChange={(e) => updateNodeData(selectedNode.id, { description: e.target.value })}
                      placeholder="Add deep context to this idea..."
                      className="min-h-[120px] w-full rounded-xl border border-white/5 bg-white/[0.02] p-4 text-[13px] leading-relaxed text-zinc-300 outline-none focus:border-emerald-500/20 transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <MetaField 
                    label="Priority" 
                    icon={<Hash size={12} />}
                    value={
                      <select 
                        value={data.priority}
                        onChange={(e) => updateNodeData(selectedNode.id, { priority: e.target.value as NodePriority })}
                        className="bg-transparent text-[13px] font-bold text-zinc-200 outline-none"
                      >
                        <option value="none">None</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    }
                  />
                  <MetaField 
                    label="Status" 
                    icon={<Clock size={12} />}
                    value={
                      <select 
                        value={data.status}
                        onChange={(e) => updateNodeData(selectedNode.id, { status: e.target.value as NodeStatus })}
                        className="bg-transparent text-[13px] font-bold text-zinc-200 outline-none"
                      >
                        <option value="none">None</option>
                        <option value="todo">Todo</option>
                        <option value="doing">Doing</option>
                        <option value="done">Done</option>
                      </select>
                    }
                  />
                </div>

                <div className="h-px bg-white/5" />

                {/* Linked Systems */}
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <SectionTitle className="text-[10px]">Linked Execution</SectionTitle>
                    <div className="flex flex-col gap-2">
                      {data.linkedTaskIds.length === 0 ? (
                        <p className="text-[12px] text-zinc-600 italic">No tasks linked yet.</p>
                      ) : (
                        data.linkedTaskIds.map(id => <LinkedItem key={id} label={`Task ${id}`} icon={<CheckSquare size={12} />} />)
                      )}
                      <Button variant="secondary" size="sm" className="mt-2 w-full justify-start gap-2 bg-white/[0.02]">
                        <CheckSquare size={14} className="text-zinc-500" />
                        <span>Link existing task</span>
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <SectionTitle className="text-[10px]">Linked Metrics</SectionTitle>
                    <div className="flex flex-col gap-2">
                      {data.linkedKpiIds.length === 0 ? (
                        <p className="text-[12px] text-zinc-600 italic">No KPIs linked yet.</p>
                      ) : (
                        data.linkedKpiIds.map(id => <LinkedItem key={id} label={`KPI ${id}`} icon={<Target size={12} />} />)
                      )}
                      <Button variant="secondary" size="sm" className="mt-2 w-full justify-start gap-2 bg-white/[0.02]">
                        <Target size={14} className="text-zinc-500" />
                        <span>Link existing KPI</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="border-t border-white/10 px-6 py-4 flex items-center justify-between bg-black/20">
               <div className="flex flex-col gap-0.5">
                 <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">Created</span>
                 <span className="text-[11px] text-zinc-400">{new Date(data.createdAt).toLocaleDateString()}</span>
               </div>
               <div className="flex flex-col gap-0.5 text-right">
                 <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">Last Sync</span>
                 <span className="text-[11px] text-zinc-400">{new Date(data.updatedAt).toLocaleTimeString()}</span>
               </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function MetaField({ label, icon, value }: { label: string; icon: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-zinc-500">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <div className="px-1">{value}</div>
    </div>
  );
}

function LinkedItem({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 transition-all hover:bg-white/[0.05]">
      <div className="flex items-center gap-2">
        <span className="text-emerald-400">{icon}</span>
        <span className="text-[13px] font-medium text-zinc-300">{label}</span>
      </div>
      <button className="text-zinc-600 hover:text-zinc-400">
        <X size={12} />
      </button>
    </div>
  );
}

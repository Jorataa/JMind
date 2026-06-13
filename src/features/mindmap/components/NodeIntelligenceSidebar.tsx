"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { X, Target, CheckSquare, Clock, Hash, AlignLeft, Plus, Trash2, Edit2 } from "lucide-react";
import { useMindMapStore, useMindMapActions, useSelectedNode, type MindMapNode, ROOT_NODE_ID } from "@/stores/use-mindmap-store";
import { useTaskActions, useTaskStore } from "@/stores/use-task-store";
import type { NodePriority, NodeStatus } from "@/types/mindmap";
import type { Task, TaskPriority } from "@/types/tasks";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

const sidebarTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

const priorityLabels: Record<TaskPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const priorityVariants: Record<TaskPriority, BadgeVariant> = {
  high: "rose",
  medium: "amber",
  low: "zinc",
};

const stickyDotColors: Record<string, string> = {
  yellow: "#fde047",
  blue: "#93c5fd",
  green: "#86efac",
  pink: "#f9a8d4",
};

export default function NodeIntelligenceSidebar() {
  const isOpen = useMindMapStore((state) => state.sidebarOpen);
  const selectedNode = useSelectedNode();
  
  // Keep the last selected node so the panel can animate out with content.
  // Guarded state adjustment during render — no effect needed.
  const [lastNode, setLastNode] = useState<MindMapNode | null>(null);
  if (selectedNode && selectedNode !== lastNode) {
    setLastNode(selectedNode);
  }

  const activeNode = selectedNode || lastNode;
  const isSticky = activeNode?.type === "sticky";

  const tasks = useTaskStore((state) => state.tasks);
  const { toggleTask } = useTaskActions();
  const {
    toggleSidebar,
    updateNodeData,
    updateNodeLabel,
    convertNodeToTask,
    pruneInvalidTaskLinks,
    removeNode,
    beginEditing,
  } = useMindMapActions();

  const validTaskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);
  const taskById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks]
  );

  useEffect(() => {
    pruneInvalidTaskLinks(validTaskIds);
  }, [pruneInvalidTaskLinks, validTaskIds]);

  if (!activeNode) return null;

  const data = activeNode.data;
  const linkedTasks = data.linkedTaskIds
    .map((taskId) => taskById.get(taskId))
    .filter((task): task is Task => Boolean(task));
  const canCreateTask = !data.isRoot && data.linkedTaskIds.length === 0;
  const isRoot = activeNode.id === ROOT_NODE_ID;

  const handleToggleLinkedTask = (task: Task) => {
    const nextCompleted = !task.completed;

    toggleTask(task.id);
    updateNodeData(activeNode.id, {
      status: nextCompleted ? "done" : "todo",
    });
  };

  const handleDeleteNode = () => {
    if (window.confirm("Are you sure you want to delete this idea?")) {
      removeNode(activeNode.id);
      toggleSidebar(false);
    }
  };

  const handleBeginRename = () => {
    toggleSidebar(false);
    beginEditing(activeNode.id);
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && selectedNode && (
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={sidebarTransition}
          className="absolute inset-y-0 right-0 z-20 w-full max-w-sm border-l border-white/10 bg-zinc-950/85 p-0 shadow-2xl backdrop-blur-2xl"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    !isSticky && (
                      data.category === "goal" ? "bg-indigo-500" :
                      data.category === "task" ? "bg-emerald-500" :
                      data.category === "idea" ? "bg-violet-500" :
                      data.category === "warning" ? "bg-rose-500" : "bg-zinc-500"
                    )
                  )}
                  style={
                    isSticky
                      ? { backgroundColor: stickyDotColors[(data.color as string) || "yellow"] ?? stickyDotColors.yellow }
                      : undefined
                  }
                />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  {isSticky ? "Sticky Note" : "Node Details"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!isRoot && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                    onClick={handleDeleteNode}
                    title="Delete idea"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleSidebar(false)}>
                  <X size={16} />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="group relative flex items-center gap-2">
                      <input
                        value={data.label}
                        onChange={(e) => updateNodeLabel(activeNode.id, e.target.value)}
                        className="bg-transparent text-[24px] font-bold text-zinc-50 outline-none placeholder:text-zinc-700 w-full"
                        placeholder="Node Title..."
                      />
                      <button
                        onClick={handleBeginRename}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-500 hover:text-zinc-300"
                        title="Focus and rename"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <AlignLeft size={14} />
                      <span className="text-[11px] font-bold uppercase tracking-widest">Description</span>
                    </div>
                    <textarea
                      value={data.description || ""}
                      onChange={(e) => updateNodeData(activeNode.id, { description: e.target.value })}
                      placeholder="Add deep context to this idea..."
                      className="min-h-[120px] w-full resize-none rounded-xl border border-white/5 bg-white/[0.02] p-4 text-[13px] leading-relaxed text-zinc-300 outline-none transition-all focus:border-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                {isSticky && (
                  <>
                    <div className="flex flex-col gap-3">
                      <SectionTitle className="text-[10px]">Sticky Color</SectionTitle>
                      <div className="flex items-center gap-3">
                        {["yellow", "blue", "green", "pink"].map((color) => (
                          <button
                            key={color}
                            onClick={() => updateNodeData(activeNode.id, { color })}
                            className={cn(
                              "h-8 w-8 rounded-full border-2 transition-all",
                              color === "yellow" ? "bg-[#fef9c3] border-[#fde047]" :
                              color === "blue" ? "bg-[#dbeafe] border-[#93c5fd]" :
                              color === "green" ? "bg-[#dcfce7] border-[#86efac]" :
                              "bg-[#fce7f3] border-[#f9a8d4]",
                              (data.color || "yellow") === color ? "scale-110 ring-2 ring-white/20 shadow-lg border-white/40" : "opacity-40 hover:opacity-100 border-transparent"
                            )}
                            title={color.charAt(0).toUpperCase() + color.slice(1)}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="h-px bg-white/5" />
                  </>
                )}

                {/* Priority/status render as badges on idea nodes; a sticky's
                    face shows none of that, so offering the fields would be
                    dishonest UI. */}
                {!isSticky && (
                  <>
                    <div className="grid grid-cols-2 gap-6">
                      <MetaField
                        label="Priority"
                        icon={<Hash size={12} />}
                        value={
                          <select
                            value={data.priority}
                            onChange={(e) => updateNodeData(activeNode.id, { priority: e.target.value as NodePriority })}
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
                            onChange={(e) => updateNodeData(activeNode.id, { status: e.target.value as NodeStatus })}
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
                  </>
                )}

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <SectionTitle className="text-[10px]">Linked Execution</SectionTitle>
                    <div className="flex flex-col gap-2">
                      {linkedTasks.length === 0 ? (
                        <p className="text-[12px] italic text-zinc-600">No tasks linked yet.</p>
                      ) : (
                        linkedTasks.map((task) => (
                          <LinkedTaskItem
                            key={task.id}
                            task={task}
                            onToggle={() => handleToggleLinkedTask(task)}
                          />
                        ))
                      )}

                      {canCreateTask && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mt-2 w-full justify-start gap-2 bg-white/[0.02]"
                          onClick={() => convertNodeToTask(activeNode.id)}
                        >
                          <Plus size={14} className="text-zinc-500" />
                          <span>Create task from node</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {!isSticky && (
                    <div className="flex flex-col gap-3">
                      <SectionTitle className="text-[10px]">Linked Metrics</SectionTitle>
                      <div className="flex flex-col gap-2">
                        {data.linkedKpiIds.length === 0 ? (
                          <p className="text-[12px] italic text-zinc-600">No KPIs linked yet.</p>
                        ) : (
                          data.linkedKpiIds.map((id) => (
                            <LinkedItem key={id} label={`KPI ${id}`} icon={<Target size={12} />} />
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 bg-black/20 px-6 py-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">Created</span>
                <span className="text-[11px] text-zinc-400">{new Date(data.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex flex-col gap-0.5 text-right">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">Updated</span>
                <span className="text-[11px] text-zinc-400">{new Date(data.updatedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function MetaField({ label, icon, value }: { label: string; icon: ReactNode; value: ReactNode }) {
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

function LinkedTaskItem({ task, onToggle }: { task: Task; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.03] bg-white/[0.02] px-3 py-2.5 transition-all hover:bg-white/[0.04] group">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-300",
          task.completed
            ? "border-emerald-500 bg-emerald-500 text-zinc-950"
            : "border-white/10 text-transparent group-hover:border-emerald-500/50"
        )}
        aria-label={task.completed ? "Mark task as pending" : "Mark task as done"}
      >
        <CheckSquare size={12} strokeWidth={3} className={cn(!task.completed && "opacity-0 group-hover:opacity-40 text-emerald-500")} />
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[13px] font-medium text-zinc-200 transition-all",
            task.completed && "text-zinc-500 line-through opacity-60"
          )}
        >
          {task.title}
        </p>
      </div>
      <Badge variant={task.completed ? "emerald" : priorityVariants[task.priority]}>
        {task.completed ? "Done" : priorityLabels[task.priority]}
      </Badge>
    </div>
  );
}

function LinkedItem({ label, icon }: { label: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.03] bg-white/[0.02] px-3 py-2.5 transition-all hover:bg-white/[0.04]">
      <span className="text-zinc-500 group-hover:text-emerald-400 transition-colors">{icon}</span>
      <span className="text-[13px] font-medium text-zinc-300">{label}</span>
    </div>
  );
}

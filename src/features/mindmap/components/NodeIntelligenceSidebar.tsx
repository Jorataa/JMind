"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { X, Target, Check, Clock, Hash, AlignLeft, Plus, Trash2, Edit2, Sparkles } from "lucide-react";
import { useMindMapStore, useMindMapActions, useSelectedNode, type MindMapNode, ROOT_NODE_ID } from "@/stores/use-mindmap-store";
import { useTaskActions, useTaskStore } from "@/stores/use-task-store";
import type { NodePriority, NodeStatus } from "@/types/mindmap";
import type { Task, TaskPriority } from "@/types/tasks";
import { cn } from "@/lib/cn";

const sidebarTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

const priorityChip: Record<TaskPriority, string> = {
  high: "bg-clay-bg text-clay-text",
  medium: "bg-straw text-straw-text",
  low: "bg-sunken text-ink-600",
};

const stickyDotColors: Record<string, string> = {
  yellow: "#E9DDB4",
  blue: "#CFDAE2",
  green: "#D8E0CC",
  pink: "#E8D2C7",
};

const CATEGORY_META: Record<string, { label: string; dot: string }> = {
  goal: { label: "Goal", dot: "bg-green-800" },
  task: { label: "Action", dot: "bg-emerald-500" },
  idea: { label: "Idea", dot: "bg-ochre-500" },
  warning: { label: "Risk", dot: "bg-clay-500" },
  default: { label: "Node", dot: "bg-ink-400" },
};

/**
 * Node details panel (I): a paper dock on the canvas edge — title, context,
 * priority/status, linked execution. Every field writes straight to the store.
 */
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
  const category = CATEGORY_META[data.category ?? "default"] ?? CATEGORY_META.default;

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
          aria-label="Node details"
          className="absolute inset-y-0 right-0 z-20 w-full max-w-sm border-l border-line-hair bg-card shadow-float-2"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between border-b border-line-soft px-6 py-4">
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn("h-[7px] w-[7px] rounded-full", !isSticky && category.dot)}
                    style={
                      isSticky
                        ? { backgroundColor: stickyDotColors[(data.color as string) || "yellow"] ?? stickyDotColors.yellow }
                        : undefined
                    }
                  />
                  <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
                    {isSticky ? "Sticky Note" : category.label}
                  </span>
                </div>
                {/* One-line note the AI wrote when it created this node. Only
                    AI-generated nodes have it — manual nodes show nothing here. */}
                {!isSticky && data.aiDescription && (
                  <p className="flex items-start gap-1.5 text-[12.5px] leading-relaxed text-ink-600">
                    <Sparkles size={11} className="mt-1 shrink-0 text-emerald-600" />
                    <span>{data.aiDescription}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {!isRoot && (
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-clay-bg hover:text-clay-text"
                    onClick={handleDeleteNode}
                    title="Delete idea"
                    aria-label="Delete idea"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-sunken hover:text-ink-900"
                  onClick={() => toggleSidebar(false)}
                  aria-label="Close details"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
              <div className="flex flex-col gap-7">
                <div className="flex flex-col gap-4">
                  <div className="group relative flex items-center gap-2">
                    <input
                      value={data.label}
                      onChange={(e) => updateNodeLabel(activeNode.id, e.target.value)}
                      className="w-full bg-transparent font-serif text-[24px] leading-snug text-ink-900 outline-none placeholder:text-ink-400"
                      placeholder="Node title…"
                      aria-label="Node title"
                    />
                    <button
                      onClick={handleBeginRename}
                      className="p-1 text-ink-400 opacity-0 transition-opacity hover:text-ink-900 group-hover:opacity-100"
                      title="Focus and rename on canvas"
                      aria-label="Rename on canvas"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <FieldLabel icon={<AlignLeft size={13} />} label="Description" />
                    <textarea
                      value={data.description || ""}
                      onChange={(e) => updateNodeData(activeNode.id, { description: e.target.value })}
                      placeholder="Add deep context to this idea…"
                      className="min-h-[110px] w-full resize-none rounded-node border border-line-hair bg-paper p-3.5 text-[13.5px] leading-relaxed text-ink-700 outline-none transition-colors placeholder:text-ink-400 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {isSticky && (
                  <div className="flex flex-col gap-3">
                    <FieldLabel label="Sticky color" />
                    <div className="flex items-center gap-3">
                      {(["yellow", "blue", "green", "pink"] as const).map((color) => (
                        <button
                          key={color}
                          onClick={() => updateNodeData(activeNode.id, { color })}
                          className={cn(
                            "h-8 w-8 rounded-full border transition-all",
                            color === "yellow" ? "bg-[#F3E9C8]" :
                            color === "blue" ? "bg-[#E2E9EE]" :
                            color === "green" ? "bg-[#E9EDE0]" :
                            "bg-[#F2E4DC]",
                            (data.color || "yellow") === color
                              ? "scale-110 border-green-800 ring-1 ring-green-800/30"
                              : "border-line-strong opacity-60 hover:opacity-100"
                          )}
                          title={color.charAt(0).toUpperCase() + color.slice(1)}
                          aria-label={`Set sticky color to ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Priority/status render on idea nodes; a sticky's face shows
                    none of that, so offering the fields would be dishonest UI. */}
                {!isSticky && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <FieldLabel icon={<Hash size={12} />} label="Priority" />
                      <select
                        value={data.priority}
                        onChange={(e) => updateNodeData(activeNode.id, { priority: e.target.value as NodePriority })}
                        className="h-8 rounded-full border border-line-hair bg-card px-2.5 text-[13px] font-medium text-ink-900 outline-none focus:border-emerald-500"
                      >
                        <option value="none">None</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <FieldLabel icon={<Clock size={12} />} label="Status" />
                      <select
                        value={data.status}
                        onChange={(e) => updateNodeData(activeNode.id, { status: e.target.value as NodeStatus })}
                        className="h-8 rounded-full border border-line-hair bg-card px-2.5 text-[13px] font-medium text-ink-900 outline-none focus:border-emerald-500"
                      >
                        <option value="none">None</option>
                        <option value="todo">Todo</option>
                        <option value="doing">Doing</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="h-px bg-line-soft" />

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <FieldLabel label="Linked execution" />
                    <div className="flex flex-col gap-2">
                      {linkedTasks.length === 0 ? (
                        <p className="font-serif text-[13px] italic text-ink-500">No tasks linked yet.</p>
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
                        <button
                          type="button"
                          className="mt-1 flex w-full items-center gap-2 rounded-full border border-[#C9C4B4] px-3.5 py-2 text-[12.5px] text-green-800 transition-colors hover:border-green-800 hover:bg-[rgba(36,82,59,0.04)]"
                          onClick={() => convertNodeToTask(activeNode.id)}
                        >
                          <Plus size={13} />
                          Create task from node
                        </button>
                      )}
                    </div>
                  </div>

                  {!isSticky && (
                    <div className="flex flex-col gap-3">
                      <FieldLabel label="Linked goals" />
                      <div className="flex flex-col gap-2">
                        {data.linkedKpiIds.length === 0 ? (
                          <p className="font-serif text-[13px] italic text-ink-500">No goals linked yet.</p>
                        ) : (
                          data.linkedKpiIds.map((id) => (
                            <div
                              key={id}
                              className="flex items-center gap-3 rounded-node border border-line-hair bg-paper px-3 py-2.5"
                            >
                              <Target size={12} className="text-green-800" />
                              <span className="text-[13px] font-medium text-ink-700">Goal {id}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-line-soft bg-paper px-6 py-3.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9.5px] font-medium uppercase tracking-[0.18em] text-ink-400">Created</span>
                <span className="font-mono text-[11px] text-ink-600">{new Date(data.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex flex-col gap-0.5 text-right">
                <span className="text-[9.5px] font-medium uppercase tracking-[0.18em] text-ink-400">Updated</span>
                <span className="font-mono text-[11px] text-ink-600">{new Date(data.updatedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function FieldLabel({ icon, label }: { icon?: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-ink-500">
      {icon}
      <span className="text-[10.5px] font-medium uppercase tracking-[0.18em]">{label}</span>
    </div>
  );
}

function LinkedTaskItem({ task, onToggle }: { task: Task; onToggle: () => void }) {
  return (
    <div className="group flex items-center gap-3 rounded-node border border-line-hair bg-paper px-3 py-2.5 transition-colors hover:bg-[#FAF8F1]">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition-colors",
          task.completed
            ? "border-emerald-500 text-emerald-500"
            : "border-ink-400 text-transparent hover:border-green-800"
        )}
        aria-label={task.completed ? "Mark task as pending" : "Mark task as done"}
      >
        <Check size={11} strokeWidth={3} />
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[13px] font-medium text-ink-700",
            task.completed && "text-ink-400 line-through"
          )}
        >
          {task.title}
        </p>
      </div>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[10.5px] font-medium",
          task.completed ? "bg-sage-surface text-green-800" : priorityChip[task.priority]
        )}
      >
        {task.completed ? "done" : task.priority}
      </span>
    </div>
  );
}

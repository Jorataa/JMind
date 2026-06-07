"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTaskStore, useTaskActions, useFilteredTasks, TaskPriority, TaskEnergy } from "@/stores/use-task-store";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import TaskToolbar from "./components/TaskToolbar";
import { Tag, Trash2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { motion, AnimatePresence } from "framer-motion";

const priorityLabels: Record<TaskPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const energyLabels: Record<TaskEnergy, string> = {
  deep: "Deep Focus",
  quick: "Quick Win",
  low: "Low Energy",
};

function getPriorityVariant(priority: TaskPriority): BadgeVariant {
  const variants: Record<TaskPriority, BadgeVariant> = {
    high: "rose",
    medium: "amber",
    low: "default",
  };
  return variants[priority];
}

export default function TaskPanel() {
  const tasks = useTaskStore((state) => state.tasks);
  const filteredTasks = useFilteredTasks();
  const { addTask, toggleTask, removeTask } = useTaskActions();
  
  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [energy, setEnergy] = useState<TaskEnergy>("quick");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  const completedCount = useMemo(() => tasks.filter((task) => task.completed).length, [tasks]);
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    addTask(trimmedTitle, priority, energy, category.trim() || undefined);
    setTitle("");
    setCategory("");
  }

  if (!isHydrated) {
    return <Card className="h-64 animate-pulse bg-white/[0.02]" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <TaskToolbar />

      <Card className="p-0 overflow-hidden border-white/5 bg-zinc-900/50 shadow-2xl">
        {/* Header / Progress */}
        <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between bg-white/[0.02]">
          <div className="flex flex-col gap-1">
            <h3 className="text-[16px] font-bold text-zinc-50">Active Execution</h3>
            <p className="text-[12px] text-zinc-500 font-medium uppercase tracking-widest">
              {completedCount} / {tasks.length} Completed
            </p>
          </div>
          <div className="flex min-w-48 flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-tighter">
              <span>Overall Progress</span>
              <span className="text-emerald-400">{progress}%</span>
            </div>
            <ProgressBar progress={progress} variant="emerald" className="h-1.5" />
          </div>
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleAddTask}
          className="grid gap-3 border-b border-white/10 p-6 lg:grid-cols-[1fr_140px_140px_140px_auto]"
        >
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Define next action..."
            className="h-10 rounded-xl border border-white/10 bg-zinc-950/50 px-4 text-[13px] text-zinc-100 outline-none transition-all placeholder:text-zinc-600 focus:border-emerald-400/30 focus:ring-2 focus:ring-emerald-400/5"
          />
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (Opt)"
            className="h-10 rounded-xl border border-white/10 bg-zinc-950/50 px-4 text-[13px] text-zinc-100 outline-none transition-all placeholder:text-zinc-600 focus:border-emerald-400/30 focus:ring-2 focus:ring-emerald-400/5"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="h-10 rounded-xl border border-white/10 bg-zinc-950/50 px-3 text-[12px] font-bold text-zinc-400 uppercase tracking-widest outline-none focus:border-emerald-400/30"
          >
            <option value="high">High Priority</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={energy}
            onChange={(e) => setEnergy(e.target.value as TaskEnergy)}
            className="h-10 rounded-xl border border-white/10 bg-zinc-950/50 px-3 text-[12px] font-bold text-zinc-400 uppercase tracking-widest outline-none focus:border-emerald-400/30"
          >
            <option value="deep">Deep Focus</option>
            <option value="quick">Quick Win</option>
            <option value="low">Low Energy</option>
          </select>
          <Button type="submit" className="h-10 px-6 font-bold uppercase tracking-widest text-[11px]">
            Add Action
          </Button>
        </form>

        {/* Task List */}
        <div className="flex flex-col divide-y divide-white/5">
          <AnimatePresence initial={false}>
            {filteredTasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-6 py-12 text-center"
              >
                <p className="text-[13px] text-zinc-600 font-medium">No actions found matching your current view.</p>
              </motion.div>
            ) : (
              filteredTasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={cn(
                    "flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-center group",
                    task.completed && "opacity-60"
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
                        task.completed 
                          ? "bg-emerald-400 border-emerald-400 text-zinc-950" 
                          : "border-white/20 text-transparent hover:border-emerald-400/50"
                      )}
                    >
                      <CheckCircle2 size={12} strokeWidth={3} />
                    </button>
                    
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className={cn(
                        "text-[14px] font-medium leading-tight truncate transition-all",
                        task.completed ? "text-zinc-500 line-through" : "text-zinc-100"
                      )}>
                        {task.title}
                      </span>
                      {task.category && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                          <Tag size={10} />
                          {task.category}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pl-9 sm:pl-0">
                    <Badge variant={getPriorityVariant(task.priority)}>
                      {priorityLabels[task.priority]}
                    </Badge>
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                      {energyLabels[task.energy]}
                    </span>
                    <button
                      onClick={() => removeTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-rose-400 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}

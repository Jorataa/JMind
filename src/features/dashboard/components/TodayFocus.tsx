"use client";

import { useMemo, useState } from "react";
import { useTaskStore, useTaskActions } from "@/stores/use-task-store";
import { useFocusActions } from "@/stores/use-focus-store";
import { useToast } from "@/stores/use-toast-store";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Button } from "@/components/ui/Button";
import { Plus, ArrowRight, CheckCircle2, Play } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { motion, AnimatePresence } from "framer-motion";
import { THEME } from "@/lib/constants/theme";

export default function TodayFocus() {
  const tasks = useTaskStore((state) => state.tasks);
  const { toggleTask, addTask } = useTaskActions();
  const { setActiveTask, setDeepWorkMode } = useFocusActions();
  const addToast = useToast();
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const focusTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.completed)
      .sort((a, b) => {
        const priorityScore = { high: 3, medium: 2, low: 1 };
        return priorityScore[b.priority] - priorityScore[a.priority];
      })
      .slice(0, 5);
  }, [tasks]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask(newTaskTitle, "medium", "quick", "Inbox");
    setNewTaskTitle("");
  };

  const handleStartFocus = (taskId: string, taskTitle: string) => {
    setActiveTask(taskId);
    setDeepWorkMode(true);
    addToast(`Focus started: ${taskTitle}`, "info");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <SectionTitle>Today&apos;s Tasks</SectionTitle>
        <Link href="/tasks">
          <Button variant="ghost" size="sm" className="gap-2 text-zinc-500 hover:text-zinc-200">
            View All Tasks
            <ArrowRight size={14} />
          </Button>
        </Link>
      </div>

      <Card className="p-0 overflow-hidden border-white/5 bg-zinc-900/50 shadow-2xl">
        <div className="divide-y divide-white/5">
          <AnimatePresence mode="popLayout">
            {focusTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-12 text-center flex flex-col items-center gap-3"
              >
                {tasks.length === 0 ? (
                  <>
                    <div className="h-10 w-10 rounded-full bg-white/[0.04] flex items-center justify-center text-zinc-500">
                      <Plus size={20} />
                    </div>
                    <p className="text-[13px] text-zinc-500 font-medium">Nothing planned yet. Add your first action below.</p>
                  </>
                ) : (
                  <>
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <CheckCircle2 size={20} />
                    </div>
                    <p className="text-[13px] text-zinc-500 font-medium">All done for today. Enjoy the clear space.</p>
                  </>
                )}
              </motion.div>
            ) : (
              focusTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={THEME.animation.fast}
                  className="group flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/20 text-transparent transition-all hover:border-emerald-400/50 hover:text-emerald-400/50"
                    aria-label={`Mark ${task.title} as complete`}
                  >
                    <CheckCircle2 size={12} strokeWidth={3} />
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-zinc-100 truncate">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        task.priority === 'high' ? "bg-rose-500" :
                        task.priority === 'medium' ? "bg-amber-500" : "bg-zinc-500"
                      )} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                        {task.priority} Priority
                      </span>
                      {task.category && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-zinc-800" aria-hidden="true" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                            {task.category}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartFocus(task.id, task.title)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-500 opacity-100 transition-all hover:border-emerald-400/30 hover:text-emerald-400 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                    aria-label={`Start focus session for ${task.title}`}
                    title="Start focus session"
                  >
                    <Play size={14} fill="currentColor" />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Quick Add Input */}
        <form 
          onSubmit={handleQuickAdd}
          className="border-t border-white/5 bg-black/20 p-4"
        >
          <div className="relative group">
            <Plus 
              size={14} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" 
            />
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Quick add a task..."
              className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-[13px] text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-emerald-500/20 focus:bg-white/[0.05] transition-all"
            />
          </div>
        </form>
      </Card>
    </div>
  );
}

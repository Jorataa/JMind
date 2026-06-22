"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ListTodo } from "lucide-react";
import { useTaskStore, useTaskActions, useFilteredTasks } from "@/stores/use-task-store";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import TaskItem from "./TaskItem";

const focusTaskInput = () => {
  const input = document.getElementById("task-title") as HTMLInputElement | null;
  input?.focus();
  input?.scrollIntoView({ behavior: "smooth", block: "center" });
};

export default function TaskList() {
  const totalTasks = useTaskStore((state) => state.tasks.length);
  const filteredTasks = useFilteredTasks();
  const { toggleTask, removeTask } = useTaskActions();

  return (
    <div className="flex flex-col divide-y divide-white/5">
      <AnimatePresence initial={false}>
        {filteredTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {totalTasks === 0 ? (
              // A fresh list: explain what a task is, show one, and offer a
              // single clear way to add the first. Borderless so it reads as
              // the card's body, not a box-in-box.
              <EmptyState
                className="border-0 bg-transparent py-12"
                icon={<ListTodo size={22} strokeWidth={1.75} />}
                title="Your tasks live here"
                description="A task is one small action you can finish and check off."
                action={<Button onClick={focusTaskInput}>Add your first task</Button>}
                footer={
                  <div className="flex flex-col items-center gap-2.5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                      For example
                    </span>
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <span className="h-4 w-4 shrink-0 rounded-full border border-white/20" />
                      <span className="text-[13px] text-zinc-300">Sketch the landing page</span>
                      <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-rose-300">
                        High
                      </span>
                    </div>
                  </div>
                }
              />
            ) : (
              <p className="px-6 py-12 text-center text-[13px] font-medium text-zinc-600">
                No actions match your current filters.
              </p>
            )}
          </motion.div>
        ) : (
          filteredTasks.map((task) => (
            <TaskItem 
              key={task.id} 
              task={task} 
              toggleTask={toggleTask} 
              removeTask={removeTask} 
            />
          ))
        )}
      </AnimatePresence>
    </div>
  );
}

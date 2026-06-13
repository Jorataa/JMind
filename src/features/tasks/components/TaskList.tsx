"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ListTodo } from "lucide-react";
import { useTaskStore, useTaskActions, useFilteredTasks } from "@/stores/use-task-store";
import { EmptyState } from "@/components/ui/EmptyState";
import TaskItem from "./TaskItem";

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
              // A fresh list: reassure and teach, don't just state a void.
              // Borderless so it reads as the card's body, not a box-in-box.
              <EmptyState
                className="border-0 bg-transparent py-12"
                icon={<ListTodo size={22} strokeWidth={1.75} />}
                title="Your list is clear"
                description="Capture one action above — small and honest. Things move out of the way as you finish them."
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

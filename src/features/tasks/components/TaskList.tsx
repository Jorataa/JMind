"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTaskStore, useTaskActions, useFilteredTasks } from "@/stores/use-task-store";
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
            className="px-6 py-12 text-center"
          >
            <p className="text-[13px] text-zinc-600 font-medium">
              {totalTasks === 0
                ? "No actions yet. Define your first one above."
                : "No actions match your current filters."}
            </p>
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

"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Tag, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Task, TaskPriority, TaskEnergy } from "@/types/tasks";

interface TaskItemProps {
  task: Task;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
}

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

export default function TaskItem({ task, toggleTask, removeTask }: TaskItemProps) {
  return (
    <motion.div
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
          type="button"
          onClick={() => toggleTask(task.id)}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
            task.completed 
              ? "bg-emerald-400 border-emerald-400 text-zinc-950" 
              : "border-white/20 text-transparent hover:border-emerald-400/50"
          )}
          aria-label={task.completed ? `Reopen ${task.title}` : `Complete ${task.title}`}
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
          type="button"
          onClick={() => removeTask(task.id)}
          className="p-2 text-zinc-600 opacity-100 transition-all hover:text-rose-400 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
          aria-label={`Delete ${task.title}`}
          title="Delete task"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}

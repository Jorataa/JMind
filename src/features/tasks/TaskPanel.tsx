"use client";

import { useMemo } from "react";
import { useTaskStore } from "@/stores/use-task-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { Card } from "@/components/ui/Card";
import TaskToolbar from "./components/TaskToolbar";
import TaskHeader from "./components/TaskHeader";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";

export default function TaskPanel() {
  const tasks = useTaskStore((state) => state.tasks);
  const isHydrated = useHydrated();

  const completedCount = useMemo(() => tasks.filter((task) => task.completed).length, [tasks]);
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (!isHydrated) {
    return <Card className="h-64 animate-pulse bg-white/[0.02]" />;
  }

  return (
    <div className="flex flex-col gap-6">
      {tasks.length > 0 && <TaskToolbar />}

      <Card className="p-0 overflow-hidden border-white/5 bg-zinc-900/50 shadow-2xl">
        <TaskHeader 
          completedCount={completedCount} 
          totalCount={tasks.length} 
          progress={progress} 
        />
        
        <TaskForm />

        <TaskList />
      </Card>
    </div>
  );
}

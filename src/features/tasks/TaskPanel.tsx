"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type TaskPriority = "high" | "medium" | "low";
type TaskEnergy = "deep" | "quick" | "low";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  priority: TaskPriority;
  energy: TaskEnergy;
};

const STORAGE_KEY = "jmind:tasks";

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

function isTaskPriority(value: unknown): value is TaskPriority {
  return value === "high" || value === "medium" || value === "low";
}

function isTaskEnergy(value: unknown): value is TaskEnergy {
  return value === "deep" || value === "quick" || value === "low";
}

function normalizeTask(value: unknown): Task | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const task = value as Partial<Task>;
  if (
    typeof task.id !== "string" ||
    typeof task.title !== "string" ||
    typeof task.completed !== "boolean" ||
    typeof task.createdAt !== "string"
  ) {
    return null;
  }

  return {
    id: task.id,
    title: task.title,
    completed: task.completed,
    createdAt: task.createdAt,
    priority: isTaskPriority(task.priority) ? task.priority : "medium",
    energy: isTaskEnergy(task.energy) ? task.energy : "quick",
  };
}

function createTask(
  title: string,
  priority: TaskPriority,
  energy: TaskEnergy
): Task {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title,
    completed: false,
    createdAt: new Date().toISOString(),
    priority,
    energy,
  };
}

function getPriorityClass(priority: TaskPriority): string {
  const classes: Record<TaskPriority, string> = {
    high: "border-rose-300/20 bg-rose-300/10 text-rose-200",
    medium: "border-amber-300/20 bg-amber-300/10 text-amber-200",
    low: "border-zinc-300/10 bg-white/[0.04] text-zinc-400",
  };

  return classes[priority];
}

function getEnergyClass(energy: TaskEnergy): string {
  const classes: Record<TaskEnergy, string> = {
    deep: "text-sky-200",
    quick: "text-emerald-200",
    low: "text-violet-200",
  };

  return classes[energy];
}

export default function TaskPanel() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState<string>("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [energy, setEnergy] = useState<TaskEnergy>("quick");
  const [hasLoadedTasks, setHasLoadedTasks] = useState<boolean>(false);

  useEffect(() => {
    const loadTasks = window.setTimeout(() => {
      try {
        const savedTasks = window.localStorage.getItem(STORAGE_KEY);

        if (savedTasks) {
          const parsedTasks = JSON.parse(savedTasks) as unknown;

          if (Array.isArray(parsedTasks)) {
            setTasks(
              parsedTasks
                .map((task) => normalizeTask(task))
                .filter((task): task is Task => task !== null)
            );
          }
        }
      } catch (error) {
        console.warn("Could not load saved tasks.", error);
      } finally {
        setHasLoadedTasks(true);
      }
    }, 0);

    return () => window.clearTimeout(loadTasks);
  }, []);

  useEffect(() => {
    if (!hasLoadedTasks) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [hasLoadedTasks, tasks]);

  const completedCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks]
  );
  const remainingTasks = useMemo(
    () => tasks.filter((task) => !task.completed),
    [tasks]
  );
  const remainingCount = remainingTasks.length;
  const deepFocusCount = remainingTasks.filter(
    (task) => task.energy === "deep"
  ).length;
  const progress = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;

  function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    setTasks((currentTasks) => [
      createTask(trimmedTitle, priority, energy),
      ...currentTasks,
    ]);
    setTitle("");
  }

  function toggleTask(taskId: string) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  }

  function deleteTask(taskId: string) {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId)
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
      <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-[15px] font-semibold text-zinc-50">
            Today&apos;s Execution
          </h3>
          <p className="text-[13px] text-zinc-500">
            {tasks.length === 0
              ? "Start with one clear next action."
              : `${completedCount} completed, ${remainingCount} remaining, ${deepFocusCount} deep`}
          </p>
        </div>
        <div className="flex min-w-36 flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500">
            <span>Completion</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-300 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <form
        onSubmit={handleAddTask}
        className="grid gap-3 border-b border-white/10 p-5 lg:grid-cols-[1fr_128px_148px_auto]"
      >
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a clear next action..."
          className="h-10 rounded-lg border border-white/10 bg-zinc-950/50 px-3 text-[13px] text-zinc-100 outline-none transition-all duration-150 placeholder:text-zinc-600 focus:border-white/20 focus:bg-zinc-950 focus:ring-2 focus:ring-emerald-400/10"
        />
        <select
          value={priority}
          onChange={(event) =>
            setPriority(event.target.value as TaskPriority)
          }
          className="h-10 rounded-lg border border-white/10 bg-zinc-950/50 px-3 text-[13px] font-medium text-zinc-300 outline-none transition-all duration-150 focus:border-white/20 focus:ring-2 focus:ring-emerald-400/10"
          aria-label="Task priority"
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={energy}
          onChange={(event) => setEnergy(event.target.value as TaskEnergy)}
          className="h-10 rounded-lg border border-white/10 bg-zinc-950/50 px-3 text-[13px] font-medium text-zinc-300 outline-none transition-all duration-150 focus:border-white/20 focus:ring-2 focus:ring-emerald-400/10"
          aria-label="Task energy"
        >
          <option value="deep">Deep Focus</option>
          <option value="quick">Quick Win</option>
          <option value="low">Low Energy</option>
        </select>
        <button
          type="submit"
          className="h-10 rounded-lg bg-emerald-300 px-4 text-[13px] font-semibold text-zinc-950 transition-colors hover:bg-emerald-200 active:bg-emerald-400"
        >
          Add
        </button>
      </form>

      <div className="flex flex-col">
        {tasks.length === 0 ? (
          <div className="px-5 py-6 text-[13px] text-zinc-500">
            No tasks yet. Capture one useful action to start momentum.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 last:border-b-0 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  aria-label={`Mark ${task.title} as ${
                    task.completed ? "incomplete" : "complete"
                  }`}
                  className="h-4 w-4 rounded border-white/20 bg-zinc-950 accent-emerald-300"
                />
                <span
                  className={`min-w-0 flex-1 text-[13px] ${
                    task.completed
                      ? "text-zinc-600 line-through"
                      : "text-zinc-200"
                  }`}
                >
                  {task.title}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-7 sm:pl-0">
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getPriorityClass(
                    task.priority
                  )}`}
                >
                  {priorityLabels[task.priority]}
                </span>
                <span
                  className={`text-[11px] font-medium ${getEnergyClass(
                    task.energy
                  )}`}
                >
                  {energyLabels[task.energy]}
                </span>
                <button
                  type="button"
                  onClick={() => deleteTask(task.id)}
                  className="rounded-md px-2 py-1 text-[12px] font-medium text-zinc-600 transition-colors hover:bg-white/10 hover:text-zinc-300"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

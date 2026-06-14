import { create } from "zustand";
import { persist } from "zustand/middleware";
export type { Task, TaskPriority, TaskEnergy } from "@/types/tasks";
import { Task, TaskPriority, TaskEnergy } from "@/types/tasks";
import { TaskService } from "@/services/task-service";
import { useActivityStore } from "./use-activity-store";

const validPriorities = new Set<TaskPriority>(["high", "medium", "low"]);
const validEnergies = new Set<TaskEnergy>(["deep", "quick", "low"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sanitizeString = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim().length > 0 ? value : fallback;

const sanitizeDate = (value: unknown, fallback: string) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : fallback;

const sanitizeTask = (value: unknown): Task | null => {
  if (!isRecord(value)) return null;

  const now = new Date().toISOString();
  const id = sanitizeString(value.id, crypto.randomUUID());
  const title = sanitizeString(value.title, "Untitled Task");
  const priority = sanitizeString(value.priority, "medium") as TaskPriority;
  const energy = sanitizeString(value.energy, "quick") as TaskEnergy;
  const completed = value.completed === true;

  return {
    id,
    title,
    completed,
    createdAt: sanitizeDate(value.createdAt, now),
    completedAt: completed ? sanitizeDate(value.completedAt, now) : undefined,
    dueDate:
      typeof value.dueDate === "string" && !Number.isNaN(Date.parse(value.dueDate))
        ? value.dueDate
        : undefined,
    priority: validPriorities.has(priority) ? priority : "medium",
    energy: validEnergies.has(energy) ? energy : "quick",
    category: typeof value.category === "string" && value.category.trim() ? value.category : undefined,
    sourceNodeId: typeof value.sourceNodeId === "string" && value.sourceNodeId ? value.sourceNodeId : undefined,
    sourceMapId: typeof value.sourceMapId === "string" && value.sourceMapId ? value.sourceMapId : undefined,
  };
};

const sanitizeTasks = (tasks: unknown): Task[] => {
  const seen = new Set<string>();
  const taskList = Array.isArray(tasks) ? tasks : [];

  return taskList
    .map(sanitizeTask)
    .filter((task): task is Task => task !== null)
    .filter((task) => {
      if (seen.has(task.id)) return false;
      seen.add(task.id);
      return true;
    });
};

interface TaskState {
  tasks: Task[];
  filter: {
    status: "all" | "pending" | "completed";
    search: string;
    priority: "all" | TaskPriority;
  };
  actions: {
    addTask: (title: string, priority: TaskPriority, energy: TaskEnergy, category?: string, id?: string) => Task;
    toggleTask: (id: string) => void;
    updateTask: (id: string, updates: Partial<Omit<Task, "id" | "createdAt">>) => void;
    removeTask: (id: string) => void;
    setFilter: (updates: Partial<TaskState["filter"]>) => void;
  };
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      filter: {
        status: "all",
        search: "",
        priority: "all",
      },
      actions: {
        addTask: (title, priority, energy, category, id) => {
          const newTask = TaskService.createTask(title, priority, energy, category, id);
          if (get().tasks.some((task) => task.id === newTask.id)) return newTask;

          useActivityStore.getState().actions.logActivity(
            'task_created',
            `Created task: ${title}`,
            { taskId: newTask.id }
          );

          set((state) => ({ tasks: [newTask, ...state.tasks] }));
          return newTask;
        },
        toggleTask: (id) => {
          const task = get().tasks.find((t) => t.id === id);
          if (!task) return;

          const nextCompleted = !task.completed;
          useActivityStore.getState().actions.logActivity(
            nextCompleted ? 'task_completed' : 'task_uncompleted',
            `${nextCompleted ? 'Completed' : 'Reopened'} task: ${task.title}`,
            { taskId: id }
          );

          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === id ? TaskService.toggleCompletion(t) : t
            ),
          }));
        },
        updateTask: (id, updates) =>
          set((state) => ({
            tasks: state.tasks.map((task) => (task.id === id ? { ...task, ...updates } : task)),
          })),
        removeTask: (id) =>
          set((state) => ({
            tasks: state.tasks.filter((task) => task.id !== id),
          })),
        setFilter: (updates) =>
          set((state) => ({ filter: { ...state.filter, ...updates } })),
      },
    }),
    {
      name: "jmind:tasks",
      partialize: (state) => ({ tasks: sanitizeTasks(state.tasks) }),
      merge: (persisted, current) => {
        const savedState = persisted as Partial<TaskState>;

        return {
          ...current,
          tasks: sanitizeTasks(savedState.tasks),
          actions: current.actions,
        };
      },
    }
  )
);

export const useTaskActions = () => useTaskStore((state) => state.actions);
export const useTaskFilter = () => useTaskStore((state) => state.filter);
export const useFilteredTasks = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const filter = useTaskStore((state) => state.filter);
  
  return tasks.filter((task) => {
    const matchesStatus = 
      filter.status === "all" || 
      (filter.status === "completed" ? task.completed : !task.completed);
    
    const matchesPriority = 
      filter.priority === "all" || task.priority === filter.priority;
    
    const matchesSearch = 
      task.title.toLowerCase().includes(filter.search.toLowerCase()) ||
      (task.category?.toLowerCase() || "").includes(filter.search.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });
};

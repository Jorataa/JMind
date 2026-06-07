import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Task, TaskPriority, TaskEnergy } from "@/types/tasks";
import { TaskService } from "@/services/task-service";

interface TaskState {
  tasks: Task[];
  filter: {
    status: "all" | "pending" | "completed";
    search: string;
    priority: "all" | TaskPriority;
  };
  actions: {
    addTask: (title: string, priority: TaskPriority, energy: TaskEnergy, category?: string) => void;
    toggleTask: (id: string) => void;
    updateTask: (id: string, updates: Partial<Omit<Task, "id" | "createdAt">>) => void;
    removeTask: (id: string) => void;
    setFilter: (updates: Partial<TaskState["filter"]>) => void;
  };
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      filter: {
        status: "all",
        search: "",
        priority: "all",
      },
      actions: {
        addTask: (title, priority, energy, category) => {
          const newTask = TaskService.createTask(title, priority, energy, category);
          set((state) => ({ tasks: [newTask, ...state.tasks] }));
        },
        toggleTask: (id) =>
          set((state) => ({
            tasks: state.tasks.map((task) => 
              task.id === id ? TaskService.toggleCompletion(task) : task
            ),
          })),
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
      partialize: (state) => ({ tasks: state.tasks }),
    }
  )
);

export const useTaskActions = () => useTaskStore((state) => state.actions);
export const useTaskFilter = () => useTaskStore((state) => state.filter);
export const useFilteredTasks = () => {
  const { tasks, filter } = useTaskStore();
  
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

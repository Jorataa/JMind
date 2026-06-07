import { Task, TaskPriority, TaskEnergy } from "@/types/tasks";

/**
 * Service for Task management logic.
 */
export const TaskService = {
  /**
   * Creates a new task object
   */
  createTask: (
    title: string, 
    priority: TaskPriority, 
    energy: TaskEnergy, 
    category?: string
  ): Task => {
    return {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      completed: false,
      createdAt: new Date().toISOString(),
      priority,
      energy,
      category,
    };
  },

  /**
   * Logic for toggling task completion
   */
  toggleCompletion: (task: Task): Task => {
    const isCompleting = !task.completed;
    return {
      ...task,
      completed: isCompleting,
      completedAt: isCompleting ? new Date().toISOString() : undefined,
    };
  },

  /**
   * Mock sync for future backend
   */
  sync: async (tasks: Task[]): Promise<void> => {
    console.log("TaskService: Syncing tasks...", tasks.length);
    return new Promise((resolve) => setTimeout(resolve, 200));
  },
};

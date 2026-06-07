export type TaskPriority = "high" | "medium" | "low";
export type TaskEnergy = "deep" | "quick" | "low";
export type TaskStatus = "pending" | "in-progress" | "completed";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  dueDate?: string;
  priority: TaskPriority;
  energy: TaskEnergy;
  category?: string;
}

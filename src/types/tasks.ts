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
  /** Optional project group (grove) — additive; legacy tasks simply have none. */
  groveId?: string;
  /** Set when the task was created from a mind-map node — lets the task jump back to it. */
  sourceNodeId?: string;
  sourceMapId?: string;
}

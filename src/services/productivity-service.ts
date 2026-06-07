import { Task } from "@/stores/use-task-store";
import { KPI } from "@/stores/use-kpi-store";

/**
 * Domain service for Productivity logic.
 * This layer will eventually interact with API routes / Prisma.
 */
export const ProductivityService = {
  /**
   * Syncs local state with backend (MOCK)
   */
  sync: async (data: { tasks: Task[]; kpis: KPI[] }) => {
    console.log("ProductivityService: Syncing with server...", data);
    // In the future: return fetch('/api/sync', { method: 'POST', body: JSON.stringify(data) })
    return new Promise((resolve) => setTimeout(resolve, 500));
  },

  /**
   * Generates a monthly report (MOCK)
   */
  generateReport: async () => {
    return {
      score: 85,
      completedTasks: 120,
      activeKPIs: 5,
    };
  }
};

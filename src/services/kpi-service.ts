import { KPI } from "@/types/kpi";

/**
 * Service for KPI orchestration.
 */
export const KPIService = {
  /**
   * Creates a new KPI
   */
  createKPI: (label: string, target: number, unit: string, category?: string, current = 0): KPI => {
    const now = new Date().toISOString();
    const value = Math.max(current, 0);
    return {
      id: crypto.randomUUID(),
      label,
      value,
      target,
      unit,
      category,
      updatedAt: now,
      history: [{ value, timestamp: now }],
    };
  },

  /**
   * Logic for updating progress and maintaining history
   */
  updateProgress: (kpi: KPI, value: number): KPI => {
    const now = new Date().toISOString();
    return {
      ...kpi,
      value,
      updatedAt: now,
      history: [...kpi.history, { value, timestamp: now }].slice(-50),
    };
  },

  /**
   * Mock sync for future backend
   */
  sync: async (kpis: KPI[]): Promise<void> => {
    console.log("KPIService: Syncing metrics...", kpis.length);
    return new Promise((resolve) => setTimeout(resolve, 200));
  },
};

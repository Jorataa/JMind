import { KPI } from "@/types/kpi";

/**
 * Service for KPI orchestration.
 */
export const KPIService = {
  /**
   * Creates a new KPI
   */
  createKPI: (label: string, target: number, unit: string, category?: string): KPI => {
    const now = new Date().toISOString();
    return {
      id: `kpi-${Date.now()}`,
      label,
      value: 0,
      target,
      unit,
      category,
      updatedAt: now,
      history: [{ value: 0, timestamp: now }],
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

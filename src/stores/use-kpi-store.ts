import { create } from "zustand";
import { persist } from "zustand/middleware";
import { KPI } from "@/types/kpi";
import { KPIService } from "@/services/kpi-service";

interface KPIState {
  kpis: KPI[];
  // Actions
  actions: {
    addKPI: (label: string, target: number, unit: string, category?: string) => void;
    updateProgress: (id: string, value: number) => void;
    editKPI: (id: string, updates: Partial<Omit<KPI, "id" | "updatedAt" | "history">>) => void;
    removeKPI: (id: string) => void;
  };
}

export const useKPIStore = create<KPIState>()(
  persist(
    (set) => ({
      kpis: [],
      actions: {
        addKPI: (label, target, unit, category) => {
          const newKPI = KPIService.createKPI(label, target, unit, category);
          set((state) => ({ kpis: [newKPI, ...state.kpis] }));
        },
        updateProgress: (id, value) =>
          set((state) => ({
            kpis: state.kpis.map((kpi) =>
              kpi.id === id ? KPIService.updateProgress(kpi, value) : kpi
            ),
          })),
        editKPI: (id, updates) =>
          set((state) => ({
            kpis: state.kpis.map((kpi) =>
              kpi.id === id
                ? { ...kpi, ...updates, updatedAt: new Date().toISOString() }
                : kpi
            ),
          })),
        removeKPI: (id) =>
          set((state) => ({
            kpis: state.kpis.filter((kpi) => kpi.id !== id),
          })),
      },
    }),
    {
      name: "jmind:kpis",
      partialize: (state) => ({ kpis: state.kpis }),
    }
  )
);

export const useKPIActions = () => useKPIStore((state) => state.actions);

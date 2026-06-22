import { create } from "zustand";
import { persist } from "zustand/middleware";
export type { KPI } from "@/types/kpi";
import { KPI } from "@/types/kpi";
import { KPIService } from "@/services/kpi-service";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sanitizeString = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim().length > 0 ? value : fallback;

const sanitizeNumber = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const sanitizeDate = (value: unknown, fallback: string) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : fallback;

const sanitizeKPI = (value: unknown): KPI | null => {
  if (!isRecord(value)) return null;

  const now = new Date().toISOString();
  const id = sanitizeString(value.id, crypto.randomUUID());
  const history = Array.isArray(value.history)
    ? value.history
        .filter(isRecord)
        .map((entry) => ({
          value: sanitizeNumber(entry.value),
          timestamp: sanitizeDate(entry.timestamp, now),
        }))
        .slice(-50)
    : [];

  return {
    id,
    label: sanitizeString(value.label, "Untitled KPI"),
    value: sanitizeNumber(value.value),
    target: Math.max(sanitizeNumber(value.target, 1), 1),
    unit: sanitizeString(value.unit, "unit"),
    category: typeof value.category === "string" && value.category.trim() ? value.category : undefined,
    updatedAt: sanitizeDate(value.updatedAt, now),
    history: history.length > 0 ? history : [{ value: sanitizeNumber(value.value), timestamp: now }],
  };
};

const sanitizeKPIs = (kpis: unknown): KPI[] => {
  const seen = new Set<string>();
  const kpiList = Array.isArray(kpis) ? kpis : [];

  return kpiList
    .map(sanitizeKPI)
    .filter((kpi): kpi is KPI => kpi !== null)
    .filter((kpi) => {
      if (seen.has(kpi.id)) return false;
      seen.add(kpi.id);
      return true;
    });
};

interface KPIState {
  kpis: KPI[];
  // Actions
  actions: {
    addKPI: (label: string, target: number, unit: string, category?: string, current?: number) => void;
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
        addKPI: (label, target, unit, category, current) => {
          const newKPI = KPIService.createKPI(label, Math.max(target, 1), unit, category, current);
          set((state) => ({ kpis: [newKPI, ...state.kpis] }));
        },
        updateProgress: (id, value) =>
          set((state) => ({
            kpis: state.kpis.map((kpi) =>
              kpi.id === id ? KPIService.updateProgress(kpi, Math.max(value, 0)) : kpi
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
      partialize: (state) => ({ kpis: sanitizeKPIs(state.kpis) }),
      merge: (persisted, current) => {
        const savedState = persisted as Partial<KPIState>;

        return {
          ...current,
          kpis: sanitizeKPIs(savedState.kpis),
          actions: current.actions,
        };
      },
    }
  )
);

export const useKPIActions = () => useKPIStore((state) => state.actions);

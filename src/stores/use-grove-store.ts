import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Groves — the user's project groups (design handoff §3.4, §6.1).
 * A grove is just an id + name + dot colour; maps (and later notes/tasks)
 * attach to a grove via `groveId`. Purely additive to the existing data
 * model: legacy maps simply have no groveId until the user (or the one-time
 * adoption pass in the rail) assigns one.
 */
export type GroveColor = "emerald" | "ochre" | "clay";

export interface Grove {
  id: string;
  name: string;
  color: GroveColor;
  createdAt: string;
}

const GROVE_COLORS: readonly GroveColor[] = ["emerald", "ochre", "clay"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sanitizeGrove = (value: unknown): Grove | null => {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || !value.id) return null;
  if (typeof value.name !== "string" || !value.name.trim()) return null;

  return {
    id: value.id,
    name: value.name.trim(),
    color: GROVE_COLORS.includes(value.color as GroveColor)
      ? (value.color as GroveColor)
      : "emerald",
    createdAt:
      typeof value.createdAt === "string" && !Number.isNaN(Date.parse(value.createdAt))
        ? value.createdAt
        : new Date().toISOString(),
  };
};

const sanitizeGroves = (groves: unknown): Grove[] => {
  const seen = new Set<string>();
  return (Array.isArray(groves) ? groves : [])
    .map(sanitizeGrove)
    .filter((grove): grove is Grove => grove !== null)
    .filter((grove) => {
      if (seen.has(grove.id)) return false;
      seen.add(grove.id);
      return true;
    });
};

interface GroveState {
  groves: Grove[];
  actions: {
    addGrove: (name: string, color?: GroveColor) => Grove;
    renameGrove: (id: string, name: string) => void;
    setGroveColor: (id: string, color: GroveColor) => void;
    removeGrove: (id: string) => void;
  };
}

export const useGroveStore = create<GroveState>()(
  persist(
    (set, get) => ({
      groves: [],
      actions: {
        addGrove: (name, color) => {
          // Cycle the dot palette so adjacent groves stay distinguishable.
          const nextColor =
            color ?? GROVE_COLORS[get().groves.length % GROVE_COLORS.length];
          const grove: Grove = {
            id: crypto.randomUUID(),
            name: name.trim() || "New grove",
            color: nextColor,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({ groves: [...state.groves, grove] }));
          return grove;
        },
        renameGrove: (id, name) =>
          set((state) => ({
            groves: state.groves.map((grove) =>
              grove.id === id && name.trim() ? { ...grove, name: name.trim() } : grove
            ),
          })),
        setGroveColor: (id, color) =>
          set((state) => ({
            groves: state.groves.map((grove) =>
              grove.id === id ? { ...grove, color } : grove
            ),
          })),
        removeGrove: (id) =>
          set((state) => ({
            groves: state.groves.filter((grove) => grove.id !== id),
          })),
      },
    }),
    {
      name: "jmind:groves",
      partialize: (state) => ({ groves: sanitizeGroves(state.groves) }),
      merge: (persisted, current) => ({
        ...current,
        groves: sanitizeGroves((persisted as Partial<GroveState>)?.groves),
        actions: current.actions,
      }),
    }
  )
);

export const useGroves = () => useGroveStore((state) => state.groves);
export const useGroveActions = () => useGroveStore((state) => state.actions);

/** Dot colour → Tailwind class, kept here so every grove dot renders alike. */
export const GROVE_DOT_CLASS: Record<GroveColor, string> = {
  emerald: "bg-emerald-500",
  ochre: "bg-ochre-500",
  clay: "bg-clay-500",
};

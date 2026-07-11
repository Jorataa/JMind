import { useMindMapStore } from "@/stores/use-mindmap-store";
import { useTaskStore } from "@/stores/use-task-store";
import { useKPIStore } from "@/stores/use-kpi-store";
import { useFocusStore } from "@/stores/use-focus-store";
import { useActivityStore } from "@/stores/use-activity-store";
import { useInboxStore } from "@/stores/use-inbox-store";
import { useWisdomStore } from "@/stores/use-wisdom-store";
import { useGroveStore } from "@/stores/use-grove-store";
import { useNoteStore } from "@/stores/use-note-store";
import { useKnowledgeStore } from "@/stores/use-knowledge-store";
import { useCalendarStore } from "@/stores/use-calendar-store";
import type { SyncedStoreKey } from "./types";

/**
 * Structural view of the bits of a zustand-persist store the sync engine needs.
 * Every persisted store satisfies this, so we avoid both `any` and a hard
 * dependency on zustand's internal types.
 */
export interface PersistedStore {
  subscribe: (listener: () => void) => () => void;
  persist: {
    rehydrate: () => void | Promise<void>;
    getOptions: () => { version?: number };
  };
}

/**
 * The single source of truth mapping each synced localStorage key to its live
 * store. Mirrors `src/lib/cross-tab-sync.ts` (which syncs these same stores
 * across tabs) — cloud sync extends that exact pattern across devices.
 */
const STORES: Record<SyncedStoreKey, PersistedStore> = {
  "jmind:mindmap": useMindMapStore,
  "jmind:tasks": useTaskStore,
  "jmind:kpis": useKPIStore,
  "jmind:focus": useFocusStore,
  "jmind:activity": useActivityStore,
  "jmind:inbox": useInboxStore,
  "jmind:wisdom": useWisdomStore,
  "jmind:groves": useGroveStore,
  "jmind:notes": useNoteStore,
  "jmind:knowledge": useKnowledgeStore,
  "jmind:calendar": useCalendarStore,
};

export function getSyncedStore(key: SyncedStoreKey): PersistedStore | undefined {
  return STORES[key];
}

export function forEachSyncedStore(fn: (key: SyncedStoreKey, store: PersistedStore) => void): void {
  (Object.entries(STORES) as [SyncedStoreKey, PersistedStore][]).forEach(([key, store]) => fn(key, store));
}

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
import { useUIStore } from "@/stores/use-ui-store";

/**
 * Keeps zustand-persist stores in sync across tabs/windows.
 *
 * `storage` events only fire in OTHER tabs (never the writer), so each tab
 * simply rehydrates the store whose key changed. Store `merge` functions are
 * responsible for keeping per-tab UI state (selection, viewport) intact —
 * see use-mindmap-store.
 */
const STORES_BY_KEY = {
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
  "jmind:ui": useUIStore,
} as const;

let initialized = false;

export function initCrossTabSync() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("storage", (event) => {
    if (!event.key || event.newValue === null) return;

    const store = STORES_BY_KEY[event.key as keyof typeof STORES_BY_KEY];
    void store?.persist.rehydrate();
  });
}

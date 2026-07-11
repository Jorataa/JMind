import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Knowledge sources (design handoff §7, §12): things the user saves to read
 * and mine for claims — PDFs, videos, links. Summaries arrive later via the
 * AI; until then a source is still a perfectly good bookmark.
 */
export type SourceType = "pdf" | "yt" | "web";
export type SummaryState = "none" | "pending" | "ready" | "failed";

export interface KnowledgeSource {
  id: string;
  type: SourceType;
  title: string;
  url?: string;
  /** AI summary text, when summaryState === "ready". */
  summary?: string;
  summaryState: SummaryState;
  groveId?: string;
  addedAt: string;
}

const SOURCE_TYPES: readonly SourceType[] = ["pdf", "yt", "web"];
const SUMMARY_STATES: readonly SummaryState[] = ["none", "pending", "ready", "failed"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sanitizeSource = (value: unknown): KnowledgeSource | null => {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || !value.id) return null;
  if (typeof value.title !== "string" || !value.title.trim()) return null;

  return {
    id: value.id,
    type: SOURCE_TYPES.includes(value.type as SourceType)
      ? (value.type as SourceType)
      : "web",
    title: value.title.trim(),
    url: typeof value.url === "string" && value.url ? value.url : undefined,
    summary: typeof value.summary === "string" && value.summary ? value.summary : undefined,
    // A summary stuck "pending" across a reload will never finish — reset it.
    summaryState:
      value.summaryState === "pending"
        ? "none"
        : SUMMARY_STATES.includes(value.summaryState as SummaryState)
          ? (value.summaryState as SummaryState)
          : "none",
    groveId:
      typeof value.groveId === "string" && value.groveId ? value.groveId : undefined,
    addedAt:
      typeof value.addedAt === "string" && !Number.isNaN(Date.parse(value.addedAt))
        ? value.addedAt
        : new Date().toISOString(),
  };
};

const sanitizeSources = (sources: unknown): KnowledgeSource[] => {
  const seen = new Set<string>();
  return (Array.isArray(sources) ? sources : [])
    .map(sanitizeSource)
    .filter((source): source is KnowledgeSource => source !== null)
    .filter((source) => {
      if (seen.has(source.id)) return false;
      seen.add(source.id);
      return true;
    });
};

interface KnowledgeState {
  sources: KnowledgeSource[];
  actions: {
    addSource: (
      title: string,
      type: SourceType,
      extras?: Partial<Pick<KnowledgeSource, "url" | "groveId">>
    ) => KnowledgeSource;
    updateSource: (
      id: string,
      updates: Partial<Omit<KnowledgeSource, "id" | "addedAt">>
    ) => void;
    removeSource: (id: string) => void;
  };
}

export const useKnowledgeStore = create<KnowledgeState>()(
  persist(
    (set) => ({
      sources: [],
      actions: {
        addSource: (title, type, extras) => {
          const source: KnowledgeSource = {
            id: crypto.randomUUID(),
            type,
            title: title.trim() || "Untitled source",
            url: extras?.url,
            summaryState: "none",
            groveId: extras?.groveId,
            addedAt: new Date().toISOString(),
          };
          set((state) => ({ sources: [source, ...state.sources] }));
          return source;
        },
        updateSource: (id, updates) =>
          set((state) => ({
            sources: state.sources.map((source) =>
              source.id === id ? { ...source, ...updates } : source
            ),
          })),
        removeSource: (id) =>
          set((state) => ({
            sources: state.sources.filter((source) => source.id !== id),
          })),
      },
    }),
    {
      name: "jmind:knowledge",
      partialize: (state) => ({ sources: sanitizeSources(state.sources) }),
      merge: (persisted, current) => ({
        ...current,
        sources: sanitizeSources((persisted as Partial<KnowledgeState>)?.sources),
        actions: current.actions,
      }),
    }
  )
);

export const useKnowledgeSources = () => useKnowledgeStore((state) => state.sources);
export const useKnowledgeActions = () => useKnowledgeStore((state) => state.actions);

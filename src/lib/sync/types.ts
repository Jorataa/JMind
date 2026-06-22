/**
 * Shared types for the optional cloud-sync layer.
 *
 * Cloud sync is strictly opt-in: when no Supabase env vars are configured, or
 * when the visitor never signs in, none of this code touches their data. The
 * local-first experience is the default and is never gated behind an account.
 */

/** The persisted stores we mirror to the cloud. UI/device prefs are excluded. */
export type SyncedStoreKey =
  | "jmind:mindmap"
  | "jmind:tasks"
  | "jmind:kpis"
  | "jmind:focus"
  | "jmind:activity"
  | "jmind:inbox"
  | "jmind:wisdom";

export const SYNCED_STORE_KEYS: readonly SyncedStoreKey[] = [
  "jmind:mindmap",
  "jmind:tasks",
  "jmind:kpis",
  "jmind:focus",
  "jmind:activity",
  "jmind:inbox",
  "jmind:wisdom",
] as const;

/**
 * A store snapshot is the partialized state a store persists to localStorage —
 * the `state` field of the zustand-persist envelope. We treat it structurally
 * (a bag of unknowns) and lean on each store's own sanitizer on rehydrate to
 * validate the shape, so the sync layer never has to duplicate that logic.
 */
export type StoreSnapshot = Record<string, unknown>;

/** One synced store plus the timestamp of its last local mutation. */
export interface StoreEnvelope {
  data: StoreSnapshot;
  /** ISO-8601 timestamp — drives last-writer-wins per store. */
  updatedAt: string;
}

/** The JSON blob stored in a user's cloud row: one envelope per store. */
export type CloudStores = Partial<Record<SyncedStoreKey, StoreEnvelope>>;

/** Local bookkeeping of each store's last-known mutation time. */
export type SyncMeta = Partial<Record<SyncedStoreKey, string>>;

/** How a first-time reconcile should resolve local vs. cloud data. */
export type ReconcileChoice = "keep-local" | "use-cloud" | "merge";

/** The signed-in identity surfaced to the UI. */
export interface SyncUser {
  id: string;
  email: string;
}

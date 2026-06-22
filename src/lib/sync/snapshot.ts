import {
  SYNCED_STORE_KEYS,
  type CloudStores,
  type StoreSnapshot,
  type SyncedStoreKey,
  type SyncMeta,
} from "./types";
import { getSyncedStore } from "./synced-stores";

/**
 * Read/write helpers around the zustand-persist localStorage envelopes.
 *
 * Each persisted store is saved as `{ state, version }`. The sync engine reads
 * `state` to push it up, and writes `state` back (then triggers a rehydrate) to
 * pull cloud data down — reusing the store's own sanitizer for validation.
 */

const META_KEY = "jmind:sync:meta";

interface PersistEnvelope {
  state?: StoreSnapshot;
  version?: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** The partialized state a store currently has in localStorage, if any. */
export function readLocalSnapshot(key: SyncedStoreKey): StoreSnapshot | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isRecord(parsed) && isRecord(parsed.state)) return parsed.state;
  } catch {
    // Corrupt entry — treat as absent rather than crashing sync.
  }
  return null;
}

/**
 * Overwrite a store's persisted snapshot and rehydrate it so the live zustand
 * state (and the React tree) immediately reflects the pulled cloud data. The
 * store's `merge`/sanitizer runs during rehydrate, validating everything.
 */
export async function writeLocalSnapshot(key: SyncedStoreKey, snapshot: StoreSnapshot): Promise<void> {
  if (typeof window === "undefined") return;

  let version = 0;
  const existing = window.localStorage.getItem(key);
  if (existing) {
    try {
      const parsed = JSON.parse(existing) as PersistEnvelope;
      if (typeof parsed.version === "number") version = parsed.version;
    } catch {
      // ignore — fall back to version 0
    }
  } else {
    version = getSyncedStore(key)?.persist.getOptions().version ?? 0;
  }

  window.localStorage.setItem(key, JSON.stringify({ state: snapshot, version } satisfies PersistEnvelope));
  await getSyncedStore(key)?.persist.rehydrate();
}

/** Whether any synced store currently holds user-created content locally. */
export function hasLocalData(): boolean {
  return SYNCED_STORE_KEYS.some((key) => {
    const snap = readLocalSnapshot(key);
    return snap !== null && snapshotHasContent(key, snap);
  });
}

/**
 * Heuristic for "is there real user work in this snapshot?" — used to decide
 * whether a first sign-in needs the keep/use/merge reconcile prompt. Empty
 * default stores (fresh install) should not trigger it.
 */
export function snapshotHasContent(key: SyncedStoreKey, snapshot: StoreSnapshot): boolean {
  switch (key) {
    case "jmind:mindmap": {
      const maps = snapshot.maps;
      if (!isRecord(maps)) return false;
      // A brand-new workspace has one empty map; treat any node anywhere as content.
      return Object.values(maps).some(
        (map) => isRecord(map) && Array.isArray(map.nodes) && map.nodes.length > 0,
      );
    }
    case "jmind:tasks":
      return Array.isArray(snapshot.tasks) && snapshot.tasks.length > 0;
    case "jmind:kpis":
      return Array.isArray(snapshot.kpis) && snapshot.kpis.length > 0;
    case "jmind:activity":
      return Array.isArray(snapshot.activities) && snapshot.activities.length > 0;
    case "jmind:inbox":
      return Array.isArray(snapshot.items) && snapshot.items.length > 0;
    case "jmind:wisdom":
      return (
        (Array.isArray(snapshot.favorites) && snapshot.favorites.length > 0) ||
        (isRecord(snapshot.reflections) && Object.keys(snapshot.reflections).length > 0)
      );
    case "jmind:focus":
      return Boolean(snapshot.dailyAnchor) || Boolean(snapshot.lastReflectionAt);
    default:
      return false;
  }
}

// ── per-store mutation timestamps (last-writer-wins bookkeeping) ──────────────

export function readMeta(): SyncMeta {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(META_KEY);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? (parsed as SyncMeta) : {};
  } catch {
    return {};
  }
}

export function writeMeta(meta: SyncMeta): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(META_KEY, JSON.stringify(meta));
}

export function setStoreUpdatedAt(key: SyncedStoreKey, iso: string): void {
  const meta = readMeta();
  meta[key] = iso;
  writeMeta(meta);
}

export function getStoreUpdatedAt(key: SyncedStoreKey): string | undefined {
  return readMeta()[key];
}

/** Build the cloud payload from the current local snapshots + their timestamps. */
export function buildCloudStores(): CloudStores {
  const meta = readMeta();
  const out: CloudStores = {};
  for (const key of SYNCED_STORE_KEYS) {
    const data = readLocalSnapshot(key);
    if (data === null) continue;
    out[key] = { data, updatedAt: meta[key] ?? new Date(0).toISOString() };
  }
  return out;
}

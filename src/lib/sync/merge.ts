import type { StoreSnapshot, SyncedStoreKey } from "./types";

/**
 * Non-destructive merge of two snapshots of the same store.
 *
 * Used only for the "Merge both" reconcile choice on first sign-in. The guiding
 * rule is: never lose a user's work. We take the UNION of collections by id, so
 * items that exist on only one side survive; on a genuine id collision the side
 * flagged newer wins the field-level values. The result is fed back through the
 * store's own sanitizer on rehydrate, so a loose shape here is safe.
 */
export function mergeSnapshots(
  key: SyncedStoreKey,
  local: StoreSnapshot,
  remote: StoreSnapshot,
  remoteIsNewer: boolean,
): StoreSnapshot {
  switch (key) {
    case "jmind:tasks":
      return { ...local, ...remote, tasks: mergeById(local.tasks, remote.tasks, remoteIsNewer) };
    case "jmind:kpis":
      return { ...local, ...remote, kpis: mergeById(local.kpis, remote.kpis, remoteIsNewer) };
    case "jmind:inbox":
      return { ...local, ...remote, items: mergeById(local.items, remote.items, remoteIsNewer) };
    case "jmind:activity":
      // Activity is a capped, time-ordered log — union, sort newest-first, cap.
      return {
        ...local,
        ...remote,
        activities: mergeById(local.activities, remote.activities, remoteIsNewer)
          .sort((a, b) => String(b.timestamp ?? "").localeCompare(String(a.timestamp ?? "")))
          .slice(0, 50),
      };
    case "jmind:mindmap":
      return mergeMindmap(local, remote, remoteIsNewer);
    case "jmind:wisdom":
      return {
        ...local,
        ...remote,
        favorites: mergeById(local.favorites, remote.favorites, remoteIsNewer),
        // Reflections are keyed by date; union, preferring the newer side's text.
        reflections: remoteIsNewer
          ? { ...asRecord(local.reflections), ...asRecord(remote.reflections) }
          : { ...asRecord(remote.reflections), ...asRecord(local.reflections) },
      };
    case "jmind:focus":
      // Scalar daily state — no collections to union; the newer side wins whole.
      return remoteIsNewer ? { ...local, ...remote } : { ...remote, ...local };
    default:
      return remoteIsNewer ? remote : local;
  }
}

/** Merge mindmaps: union the workspace dictionary, keep one consistent active map. */
function mergeMindmap(local: StoreSnapshot, remote: StoreSnapshot, remoteIsNewer: boolean): StoreSnapshot {
  const localMaps = asRecord(local.maps);
  const remoteMaps = asRecord(remote.maps);
  const mergedMaps: Record<string, unknown> = { ...localMaps };

  for (const [id, remoteMap] of Object.entries(remoteMaps)) {
    const localMap = localMaps[id];
    if (!localMap) {
      mergedMaps[id] = remoteMap;
      continue;
    }
    // Same workspace edited on both sides — keep whichever was touched last.
    const localTime = mapUpdatedAt(localMap);
    const remoteTime = mapUpdatedAt(remoteMap);
    mergedMaps[id] = remoteTime > localTime ? remoteMap : localMap;
  }

  // Prefer the newer side's "what's open" pointer so the canvas lands somewhere real.
  const base = remoteIsNewer ? { ...local, ...remote } : { ...remote, ...local };
  return { ...base, maps: mergedMaps };
}

function mapUpdatedAt(map: unknown): string {
  return isRecord(map) && typeof map.updatedAt === "string" ? map.updatedAt : "";
}

// ── helpers ──────────────────────────────────────────────────────────────────

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asRecord = (value: unknown): Record<string, unknown> => (isRecord(value) ? value : {});

const asRecordArray = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

/**
 * Union two arrays of `{ id }` records. `preferB` (the newer side) wins when the
 * same id appears in both. Order keeps newer-side items where they land.
 */
function mergeById(a: unknown, b: unknown, preferB: boolean): Record<string, unknown>[] {
  const arrA = asRecordArray(a);
  const arrB = asRecordArray(b);
  const map = new Map<string, Record<string, unknown>>();
  const [first, second] = preferB ? [arrA, arrB] : [arrB, arrA];
  for (const item of first) {
    const id = typeof item.id === "string" ? item.id : undefined;
    if (id) map.set(id, item);
  }
  for (const item of second) {
    const id = typeof item.id === "string" ? item.id : undefined;
    if (id) map.set(id, item); // second wins on collision
  }
  return [...map.values()];
}

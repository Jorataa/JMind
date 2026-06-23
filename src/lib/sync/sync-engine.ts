import type { RealtimeChannel, Session } from "@supabase/supabase-js";
import { getSupabaseClient, isSyncConfigured, type SyncClient } from "./supabase";
import { forEachSyncedStore } from "./synced-stores";
import { mergeSnapshots } from "./merge";
import {
  buildCloudStores,
  getStoreUpdatedAt,
  hasLocalData,
  readLocalSnapshot,
  setStoreUpdatedAt,
  snapshotHasContent,
  writeLocalSnapshot,
} from "./snapshot";
import {
  SYNCED_STORE_KEYS,
  type CloudStores,
  type ReconcileChoice,
  type StoreEnvelope,
  type SyncedStoreKey,
} from "./types";
import { useSyncStore } from "@/stores/use-sync-store";
import { useUIStore } from "@/stores/use-ui-store";

/**
 * The cloud-sync engine.
 *
 * Lifecycle: `initSyncEngine()` is called once from the SyncProvider. It wires
 * up Supabase auth-state changes; when a session appears it reconciles local and
 * cloud data, then keeps them in step via debounced pushes (on local change),
 * pulls (on focus + realtime), and an offline queue that flushes on reconnect.
 *
 * Everything degrades gracefully: not configured / signed out / offline all
 * leave the local-first app fully functional.
 */

const PUSH_DEBOUNCE_MS = 1500;

let initialized = false;
let storeUnsubscribers: Array<() => void> = [];
let realtimeChannel: RealtimeChannel | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushQueued = false; // a change happened but couldn't be flushed (offline/error)
let activeUserId: string | null = null;
let reconcileGate = false; // pause auto-sync until a first-run reconcile resolves
let applyingRemote = false; // writing pulled data — don't treat it as a local edit
/** localStorage snapshot strings last seen, so we only react to real changes. */
const lastSeen = new Map<SyncedStoreKey, string>();

const actions = () => useSyncStore.getState().actions;

// ── public API ───────────────────────────────────────────────────────────────

export function initSyncEngine(): void {
  if (initialized || typeof window === "undefined") return;
  const supabase = getSupabaseClient();
  if (!supabase) return; // not configured → stay fully local
  initialized = true;

  actions().setStatus("signed-out");

  // React to sign-in / sign-out / token-refresh / magic-link redirect.
  supabase.auth.onAuthStateChange((_event, session) => {
    void handleSession(supabase, session);
  });
  // Pick up any session restored from storage (or just parsed from a magic link).
  void supabase.auth.getSession().then(({ data }) => handleSession(supabase, data.session));

  window.addEventListener("focus", handleFocus);
  window.addEventListener("online", handleOnline);
}

export function isSyncAvailable(): boolean {
  return isSyncConfigured();
}

/** Sign in with an existing email + password. */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: "Sync is not configured." };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

/**
 * Create a new account with email + password. When the owner has disabled email
 * confirmation (recommended — see SETUP.md), Supabase returns a session right
 * away and `onAuthStateChange` signs the user in with no email round-trip. If
 * confirmation is still on, no session comes back and we surface that so the UI
 * can tell the user to check their inbox.
 */
export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<{ error: string | null; needsConfirmation: boolean }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: "Sync is not configured.", needsConfirmation: false };
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { error: error?.message ?? null, needsConfirmation: !error && !data.session };
}

/** Sign out, leaving all local data on the device exactly as-is. */
export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}

/** Resolve the one-time first-sign-in keep/use/merge choice. */
export async function resolveReconcile(choice: ReconcileChoice): Promise<void> {
  const supabase = getSupabaseClient();
  const pending = useSyncStore.getState().pendingReconcile;
  if (!supabase || !pending || !activeUserId) return;

  actions().setStatus("syncing");
  try {
    applyingRemote = true; // all writes below are reconciliation, not user edits
    if (choice === "use-cloud") {
      await applyCloudToLocal(pending.cloud);
    } else if (choice === "keep-local") {
      // Stamp every local store "now" so it decisively wins, then push.
      const now = new Date().toISOString();
      for (const key of SYNCED_STORE_KEYS) setStoreUpdatedAt(key, now);
      await pushLocalToCloud(supabase);
    } else {
      // merge — union both sides, stamp now, persist locally and upstream.
      const now = new Date().toISOString();
      for (const key of SYNCED_STORE_KEYS) {
        const local = readLocalSnapshot(key);
        const remote = pending.cloud[key]?.data ?? null;
        if (local && remote) {
          const remoteIsNewer = (pending.cloud[key]?.updatedAt ?? "") > (getStoreUpdatedAt(key) ?? "");
          await writeLocalSnapshot(key, mergeSnapshots(key, local, remote, remoteIsNewer));
          setStoreUpdatedAt(key, now);
        } else if (remote && !local) {
          await writeLocalSnapshot(key, remote);
          setStoreUpdatedAt(key, now);
        } else if (local) {
          setStoreUpdatedAt(key, now);
        }
      }
      await pushLocalToCloud(supabase);
    }
    applyingRemote = false;
    markReconciled(activeUserId);
    refreshLastSeen();
    finishReconcileGate();
    actions().setPendingReconcile(null);
    actions().setLastSyncedAt(new Date().toISOString());
    actions().setStatus("idle");
  } catch (err) {
    applyingRemote = false;
    actions().setError(messageOf(err));
  }
}

// ── auth/session handling ──────────────────────────────────────────────────────

async function handleSession(supabase: SyncClient, session: Session | null): Promise<void> {
  const user = session?.user;
  if (!user || !user.email) {
    teardownSignedInState();
    actions().setUser(null);
    actions().setStatus("signed-out");
    activeUserId = null;
    return;
  }

  if (activeUserId === user.id) return; // already wired up for this user
  activeUserId = user.id;
  actions().setUser({ id: user.id, email: user.email });
  actions().setStatus("syncing");

  try {
    await syncProfileName(supabase, user.id);
    const cloud = await fetchCloud(supabase, user.id);

    const needsReconcile =
      !isReconciled(user.id) && hasLocalData() && cloudHasContent(cloud);

    if (needsReconcile && cloud) {
      // Pause auto-sync and ask the user how to combine the two data sets.
      reconcileGate = true;
      actions().setPendingReconcile({ cloud });
      actions().setStatus("idle");
      return;
    }

    // No conflict: straightforward bidirectional last-writer-wins.
    await reconcileLWW(supabase, cloud);
    markReconciled(user.id);
    startLiveSync(supabase, user.id);
    actions().setLastSyncedAt(new Date().toISOString());
    actions().setStatus("idle");
  } catch (err) {
    actions().setError(messageOf(err));
  }
}

function finishReconcileGate(): void {
  if (!reconcileGate) return;
  reconcileGate = false;
  const supabase = getSupabaseClient();
  if (supabase && activeUserId) startLiveSync(supabase, activeUserId);
}

// ── live sync wiring ───────────────────────────────────────────────────────────

function startLiveSync(supabase: SyncClient, userId: string): void {
  refreshLastSeen();
  subscribeToStores();
  subscribeRealtime(supabase, userId);
}

function subscribeToStores(): void {
  if (storeUnsubscribers.length > 0) return;
  forEachSyncedStore((key, store) => {
    storeUnsubscribers.push(
      store.subscribe(() => {
        // Persist writes synchronously before subscribers fire, so localStorage
        // already holds the new snapshot. Only react when it actually changed.
        const current = window.localStorage.getItem(key) ?? "";
        if (current === lastSeen.get(key)) return;
        lastSeen.set(key, current);
        // Pulled data writes localStorage too — never echo it back as a "local edit".
        if (applyingRemote || reconcileGate) return;
        setStoreUpdatedAt(key, new Date().toISOString());
        schedulePush();
      }),
    );
  });
}

function subscribeRealtime(supabase: SyncClient, userId: string): void {
  if (realtimeChannel) return;
  realtimeChannel = supabase
    .channel(`user_state:${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "user_state", filter: `user_id=eq.${userId}` },
      () => {
        void pullFromCloud();
      },
    )
    .subscribe();
}

function teardownSignedInState(): void {
  storeUnsubscribers.forEach((off) => off());
  storeUnsubscribers = [];
  lastSeen.clear();
  if (realtimeChannel) {
    void realtimeChannel.unsubscribe();
    realtimeChannel = null;
  }
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  pushQueued = false;
  reconcileGate = false;
}

function handleFocus(): void {
  if (!activeUserId || reconcileGate) return;
  void pullFromCloud();
  if (pushQueued) schedulePush();
}

function handleOnline(): void {
  if (!activeUserId || reconcileGate) return;
  if (pushQueued) schedulePush();
}

// ── push / pull ────────────────────────────────────────────────────────────────

function schedulePush(): void {
  pushQueued = true;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void flushPush();
  }, PUSH_DEBOUNCE_MS);
}

async function flushPush(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase || !activeUserId || reconcileGate) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    actions().setStatus("offline"); // keep pushQueued; `online` event retries
    return;
  }
  actions().setStatus("syncing");
  try {
    // Read-merge-write keeps last-writer-wins correct under concurrent devices:
    // adopt any cloud store that's newer than ours before writing the row back.
    const cloud = await fetchCloud(supabase, activeUserId);
    await reconcileLWW(supabase, cloud);
    pushQueued = false;
    actions().setLastSyncedAt(new Date().toISOString());
    actions().setStatus("idle");
  } catch (err) {
    // Stay queued; a focus/online/next-change will retry.
    actions().setStatus("offline");
    actions().setError(messageOf(err));
  }
}

async function pullFromCloud(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase || !activeUserId || reconcileGate) return;
  try {
    const cloud = await fetchCloud(supabase, activeUserId);
    await reconcileLWW(supabase, cloud);
    actions().setLastSyncedAt(new Date().toISOString());
    if (useSyncStore.getState().status !== "syncing") actions().setStatus("idle");
  } catch (err) {
    actions().setError(messageOf(err));
  }
}

/**
 * Bidirectional last-writer-wins per store: pull any cloud store that's newer
 * than local into local, and if any local store is newer, write the unified row
 * back to the cloud. Idempotent and safe to run on any trigger.
 */
async function reconcileLWW(supabase: SyncClient, cloud: CloudStores | null): Promise<void> {
  const local = buildCloudStores();
  const merged: CloudStores = {};
  let localChanged = false;
  let cloudChanged = false;

  for (const key of SYNCED_STORE_KEYS) {
    const l = local[key];
    const c = cloud?.[key];

    if (l && c) {
      if (c.updatedAt > l.updatedAt) {
        await applyEnvelope(key, c);
        merged[key] = c;
        localChanged = true;
      } else {
        merged[key] = l;
        if (l.updatedAt > c.updatedAt) cloudChanged = true;
      }
    } else if (c && !l) {
      await applyEnvelope(key, c);
      merged[key] = c;
      localChanged = true;
    } else if (l && !c) {
      merged[key] = l;
      cloudChanged = true;
    }
  }

  if (localChanged) refreshLastSeen();
  if (cloudChanged) await upsertCloud(supabase, merged);
}

async function applyEnvelope(key: SyncedStoreKey, envelope: StoreEnvelope): Promise<void> {
  applyingRemote = true;
  try {
    await writeLocalSnapshot(key, envelope.data);
  } finally {
    applyingRemote = false;
  }
  setStoreUpdatedAt(key, envelope.updatedAt);
}

async function applyCloudToLocal(cloud: CloudStores): Promise<void> {
  for (const key of SYNCED_STORE_KEYS) {
    const envelope = cloud[key];
    if (envelope) await applyEnvelope(key, envelope);
  }
  refreshLastSeen();
}

async function pushLocalToCloud(supabase: SyncClient): Promise<void> {
  await upsertCloud(supabase, buildCloudStores());
}

// ── Supabase data access ────────────────────────────────────────────────────────

async function fetchCloud(supabase: SyncClient, userId: string): Promise<CloudStores | null> {
  const { data, error } = await supabase
    .from("user_state")
    .select("stores")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.stores ?? null;
}

async function upsertCloud(supabase: SyncClient, stores: CloudStores): Promise<void> {
  if (!activeUserId) return;
  const { error } = await supabase
    .from("user_state")
    .upsert(
      { user_id: activeUserId, stores, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (error) throw new Error(error.message);
}

/**
 * Carry the local display name into the cloud profile on first sign-in, and pull
 * the cloud name down to a device that doesn't have one yet — so signing up
 * never feels like starting over.
 */
async function syncProfileName(supabase: SyncClient, userId: string): Promise<void> {
  const localName = useUIStore.getState().userName.trim();
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);

  const cloudName = data?.display_name?.trim() ?? "";
  if (!cloudName && localName) {
    const { error: upErr } = await supabase
      .from("profiles")
      .upsert({ id: userId, display_name: localName, updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (upErr) throw new Error(upErr.message);
  } else if (cloudName && !localName) {
    useUIStore.getState().actions.setUserName(cloudName);
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function cloudHasContent(cloud: CloudStores | null): boolean {
  if (!cloud) return false;
  return SYNCED_STORE_KEYS.some((key) => {
    const env = cloud[key];
    return Boolean(env) && snapshotHasContent(key, env!.data);
  });
}

function refreshLastSeen(): void {
  for (const key of SYNCED_STORE_KEYS) {
    lastSeen.set(key, window.localStorage.getItem(key) ?? "");
  }
}

function reconcileFlagKey(userId: string): string {
  return `jmind:sync:reconciled:${userId}`;
}

function isReconciled(userId: string): boolean {
  return window.localStorage.getItem(reconcileFlagKey(userId)) === "1";
}

function markReconciled(userId: string): void {
  window.localStorage.setItem(reconcileFlagKey(userId), "1");
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : "Sync failed. Your data is safe on this device.";
}

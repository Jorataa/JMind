import { create } from "zustand";
import type { CloudStores, SyncUser } from "@/lib/sync/types";

/**
 * UI-facing state for cloud sync. Deliberately NOT persisted — the Supabase
 * session (stored separately by supabase-js) is the source of truth for "are we
 * signed in", and everything else here is live runtime status the engine drives.
 */
export type SyncStatus =
  | "disabled" // sync not configured by the owner (no env vars)
  | "signed-out" // configured, but the visitor is anonymous/local-only
  | "idle" // signed in, nothing in flight
  | "syncing" // a push/pull is in flight
  | "offline" // signed in but no connection; changes are queued
  | "error";

interface PendingReconcile {
  cloud: CloudStores;
}

interface SyncState {
  status: SyncStatus;
  user: SyncUser | null;
  lastSyncedAt: string | null;
  error: string | null;
  /** Set when a first sign-in finds data on both sides and needs a user choice. */
  pendingReconcile: PendingReconcile | null;
  actions: {
    setStatus: (status: SyncStatus) => void;
    setUser: (user: SyncUser | null) => void;
    setLastSyncedAt: (iso: string) => void;
    setError: (error: string | null) => void;
    setPendingReconcile: (reconcile: PendingReconcile | null) => void;
  };
}

export const useSyncStore = create<SyncState>((set) => ({
  status: "disabled",
  user: null,
  lastSyncedAt: null,
  error: null,
  pendingReconcile: null,
  actions: {
    setStatus: (status) => set({ status }),
    setUser: (user) => set({ user }),
    setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
    setError: (error) => set(error ? { error, status: "error" } : { error: null }),
    setPendingReconcile: (pendingReconcile) => set({ pendingReconcile }),
  },
}));

export const useSyncStatus = () => useSyncStore((s) => s.status);
export const useSyncUser = () => useSyncStore((s) => s.user);
export const useSyncActions = () => useSyncStore((s) => s.actions);
export const usePendingReconcile = () => useSyncStore((s) => s.pendingReconcile);
export const useLastSyncedAt = () => useSyncStore((s) => s.lastSyncedAt);
export const useSyncError = () => useSyncStore((s) => s.error);

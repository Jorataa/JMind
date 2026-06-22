"use client";

import { useEffect } from "react";
import { initSyncEngine } from "@/lib/sync/sync-engine";
import { isSyncConfigured } from "@/lib/sync/supabase";
import ReconcileModal from "./ReconcileModal";

/**
 * Mounts the cloud-sync engine once and renders the one-time reconcile prompt.
 *
 * When sync isn't configured (no env vars) this is a complete no-op, so the
 * anonymous local-first app is byte-for-byte unchanged.
 */
export default function SyncProvider() {
  useEffect(() => {
    if (!isSyncConfigured()) return;
    initSyncEngine();
  }, []);

  if (!isSyncConfigured()) return null;
  return <ReconcileModal />;
}

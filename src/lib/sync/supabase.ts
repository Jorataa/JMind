import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CloudStores } from "./types";

/**
 * Minimal hand-written schema for the two tables cloud sync touches. Keeping a
 * typed `Database` here means every query is fully type-checked without the
 * `any` that an untyped Supabase client would leak into the sync layer.
 */
export interface SyncDatabase {
  public: {
    Tables: {
      user_state: {
        Row: { user_id: string; stores: CloudStores; updated_at: string };
        Insert: { user_id: string; stores: CloudStores; updated_at?: string };
        Update: { stores?: CloudStores; updated_at?: string };
        Relationships: [];
      };
      profiles: {
        Row: { id: string; display_name: string | null; updated_at: string };
        Insert: { id: string; display_name?: string | null; updated_at?: string };
        Update: { display_name?: string | null; updated_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type SyncClient = SupabaseClient<SyncDatabase>;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True only when the owner has wired up Supabase via env vars. Every entry
 * point checks this first so an unconfigured deploy behaves exactly like the
 * original local-only app — no sign-in UI, no network calls.
 */
export function isSyncConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

let client: SyncClient | null = null;

/**
 * Lazily builds the browser Supabase client. Returns null when sync isn't
 * configured so callers can no-op cleanly. Auth is email + password, so the
 * session is simply persisted to localStorage and refreshed automatically —
 * no email round-trip or redirect handling required, which keeps this app
 * deployable as a pure static/SPA-style front end.
 */
export function getSupabaseClient(): SyncClient | null {
  if (!isSyncConfigured() || typeof window === "undefined") return null;
  if (!client) {
    client = createClient<SyncDatabase>(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "jmind:sync:auth",
      },
    });
  }
  return client;
}

"use client";

import { useState } from "react";
import { Cloud, CloudOff, RefreshCw, Check, LogOut, Mail } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { isSyncConfigured } from "@/lib/sync/supabase";
import { signInWithPassword, signUpWithPassword, signOut } from "@/lib/sync/sync-engine";
import {
  useLastSyncedAt,
  useSyncError,
  useSyncStatus,
  useSyncUser,
} from "@/stores/use-sync-store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The opt-in "Turn on Sync" surface in Settings. Renders nothing unless the
 * owner has configured Supabase, so an unconfigured build shows no sync UI at
 * all — anonymous local-first users never see a hint of an account wall.
 */
export default function SyncSettings() {
  if (!isSyncConfigured()) return null;
  return (
    <section className="flex flex-col gap-3">
      <SectionTitle className="flex items-center gap-2">
        <Cloud size={12} />
        Cloud Sync
      </SectionTitle>
      <Card className="flex flex-col gap-4 p-6" hoverable={false}>
        <SyncBody />
      </Card>
    </section>
  );
}

function SyncBody() {
  const user = useSyncUser();
  return user ? <SignedIn /> : <SignedOut />;
}

function SignedOut() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  const valid = EMAIL_RE.test(email.trim()) && password.length >= 6;

  const handleSubmit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    if (mode === "signup") {
      const { error, needsConfirmation } = await signUpWithPassword(email.trim(), password);
      setBusy(false);
      if (error) {
        setError(error);
        return;
      }
      if (needsConfirmation) setConfirmSent(true);
      // Otherwise the auth listener signs us in automatically — nothing to do.
    } else {
      const { error } = await signInWithPassword(email.trim(), password);
      setBusy(false);
      if (error) setError(error);
    }
  };

  if (confirmSent) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-emerald-400">
          <Mail size={16} />
          <h4 className="text-[14px] font-semibold">Confirm your email to finish</h4>
        </div>
        <p className="text-[12px] leading-relaxed text-zinc-500">
          We sent a confirmation link to <span className="text-zinc-300">{email.trim()}</span>.
          Open it once, then come back and sign in. (Tip: the owner can disable email
          confirmation in Supabase to skip this step entirely.)
        </p>
        <button
          onClick={() => {
            setConfirmSent(false);
            setMode("signin");
          }}
          className="self-start text-[12px] text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h4 className="text-[14px] font-semibold text-zinc-200">Turn on Sync</h4>
        <p className="text-[12px] leading-relaxed text-zinc-500">
          Your data stays on this device by default. Turn on Sync to securely back it up and
          use the same maps, tasks, goals and reflections on every device you sign in on.
        </p>
      </div>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          aria-label="Email address"
          className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[14px] text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-emerald-500/30 sm:max-w-xs"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (at least 6 characters)"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          aria-label="Password"
          className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[14px] text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-emerald-500/30 sm:max-w-xs"
        />
        <Button type="submit" size="md" disabled={!valid || busy} className="shrink-0 gap-2 sm:max-w-xs">
          <Cloud size={14} />
          {busy
            ? mode === "signup"
              ? "Creating account…"
              : "Signing in…"
            : mode === "signup"
              ? "Create account & turn on Sync"
              : "Sign in & turn on Sync"}
        </Button>
      </form>
      {error && <p className="text-[12px] text-rose-400">{error}</p>}
      <button
        onClick={() => {
          setMode((m) => (m === "signin" ? "signup" : "signin"));
          setError(null);
        }}
        className="self-start text-[12px] text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
      >
        {mode === "signin"
          ? "New here? Create an account"
          : "Already have an account? Sign in"}
      </button>
    </div>
  );
}

function SignedIn() {
  const user = useSyncUser();
  const status = useSyncStatus();
  const lastSyncedAt = useLastSyncedAt();
  const error = useSyncError();
  const [busy, setBusy] = useState(false);

  const handleSignOut = async () => {
    setBusy(true);
    await signOut();
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h4 className="text-[14px] font-semibold text-zinc-200">Sync is on</h4>
          <StatusPill status={status} />
        </div>
        <p className="text-[12px] text-zinc-500">
          Signed in as <span className="text-zinc-300">{user?.email}</span>. Your data is
          backed up and kept in step across your devices.
        </p>
        {lastSyncedAt && (
          <p className="text-[11px] text-zinc-600">
            Last synced {new Date(lastSyncedAt).toLocaleString()}
          </p>
        )}
        {error && status === "error" && <p className="text-[12px] text-rose-400">{error}</p>}
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleSignOut}
        disabled={busy}
        className="gap-2 self-start"
      >
        <LogOut size={14} />
        Sign out
      </Button>
      <p className="text-[11px] leading-relaxed text-zinc-600">
        Signing out leaves all of your data on this device untouched — it just stops syncing.
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: ReturnType<typeof useSyncStatus> }) {
  const map = {
    idle: { label: "Synced", icon: <Check size={11} />, cls: "text-emerald-400 bg-emerald-500/10" },
    syncing: { label: "Syncing…", icon: <RefreshCw size={11} className="animate-spin" />, cls: "text-sky-400 bg-sky-500/10" },
    offline: { label: "Offline — queued", icon: <CloudOff size={11} />, cls: "text-amber-400 bg-amber-500/10" },
    error: { label: "Sync issue", icon: <CloudOff size={11} />, cls: "text-rose-400 bg-rose-500/10" },
    "signed-out": { label: "", icon: null, cls: "" },
    disabled: { label: "", icon: null, cls: "" },
  } as const;
  const cfg = map[status];
  if (!cfg.label) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.cls}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

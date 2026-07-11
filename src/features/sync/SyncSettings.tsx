"use client";

import { useState } from "react";
import { Cloud, CloudOff, RefreshCw, Check, LogOut, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { isSyncConfigured } from "@/lib/sync/supabase";
import { signInWithPassword, signUpWithPassword, signOut } from "@/lib/sync/sync-engine";
import {
  useLastSyncedAt,
  useSyncError,
  useSyncStatus,
  useSyncUser,
} from "@/stores/use-sync-store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INPUT_CLS =
  "h-10 w-full rounded-full border border-line-strong bg-card px-4 text-[13.5px] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-emerald-500 sm:max-w-xs";

/**
 * The opt-in "Turn on Sync" surface in Settings (§7). Renders nothing unless
 * the owner has configured Supabase, so an unconfigured build shows no sync
 * UI at all — anonymous local-first users never see a hint of an account wall.
 */
export default function SyncSettings() {
  if (!isSyncConfigured()) return null;
  return (
    <div className="rounded-card border border-line-hair bg-card p-6">
      <SyncBody />
    </div>
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
        <div className="flex items-center gap-2 text-green-800">
          <Mail size={15} />
          <h4 className="text-[14px] font-semibold">Confirm your email to finish</h4>
        </div>
        <p className="text-[12.5px] leading-relaxed text-ink-600">
          We sent a confirmation link to{" "}
          <span className="font-medium text-ink-900">{email.trim()}</span>. Open it once,
          then come back and sign in. (Tip: the owner can disable email confirmation in
          Supabase to skip this step entirely.)
        </p>
        <button
          onClick={() => {
            setConfirmSent(false);
            setMode("signin");
          }}
          className="self-start text-[12.5px] text-green-800 underline-offset-2 hover:underline"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <h4 className="text-[14px] font-semibold text-ink-900">Turn on Sync</h4>
        <p className="text-[12.5px] leading-relaxed text-ink-600">
          Sign in to securely back up your maps, tasks, notes, goals and reflections —
          and use them on every device.
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
          className={INPUT_CLS}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (at least 6 characters)"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          aria-label="Password"
          className={INPUT_CLS}
        />
        <Button type="submit" size="md" disabled={!valid || busy} className="shrink-0 self-start">
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
      {error && (
        <p className="rounded-node border border-clay-border bg-clay-bg px-3 py-2 text-[12.5px] text-clay-text">
          {error}
        </p>
      )}
      <button
        onClick={() => {
          setMode((m) => (m === "signin" ? "signup" : "signin"));
          setError(null);
        }}
        className="self-start text-[12.5px] text-green-800 underline-offset-2 hover:underline"
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
          <h4 className="text-[14px] font-semibold text-ink-900">Sync is on</h4>
          <StatusPill status={status} />
        </div>
        <p className="text-[12.5px] text-ink-600">
          Signed in as <span className="font-medium text-ink-900">{user?.email}</span>.
          Your data is backed up and kept in step across your devices.
        </p>
        {lastSyncedAt && (
          <p className="font-mono text-[11px] text-ink-400">
            Last synced {new Date(lastSyncedAt).toLocaleString()}
          </p>
        )}
        {error && status === "error" && (
          <p className="mt-1 rounded-node border border-clay-border bg-clay-bg px-3 py-2 text-[12.5px] text-clay-text">
            {error}
          </p>
        )}
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleSignOut}
        disabled={busy}
        className="self-start"
      >
        <LogOut size={13} />
        Sign out
      </Button>
      <p className="text-[11.5px] leading-relaxed text-ink-500">
        Signing out leaves all of your data on this device untouched — it just stops syncing.
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: ReturnType<typeof useSyncStatus> }) {
  const map = {
    idle: { label: "Synced", icon: <Check size={11} />, cls: "text-green-800 bg-sage-surface" },
    syncing: {
      label: "Syncing…",
      icon: <RefreshCw size={11} className="animate-spin" />,
      cls: "text-ink-600 bg-sunken",
    },
    offline: { label: "Offline — queued", icon: <CloudOff size={11} />, cls: "text-straw-text bg-straw" },
    error: { label: "Sync issue", icon: <CloudOff size={11} />, cls: "text-clay-text bg-clay-bg" },
    "signed-out": { label: "", icon: null, cls: "" },
    disabled: { label: "", icon: null, cls: "" },
  } as const;
  const cfg = map[status];
  if (!cfg.label) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium ${cfg.cls}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

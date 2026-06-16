"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  useHasOnboarded,
  useUserName,
  useUIActions,
} from "@/stores/use-ui-store";
import {
  logVisitor,
  logVisitOncePerSession,
  markSessionLogged,
} from "@/lib/visitor-log";

const MAX_NAME_LENGTH = 40;

/**
 * First-run welcome gate. Asks the visitor what we should call them, saves it to
 * the UI store (which drives the dashboard greeting + sidebar), and logs the
 * entry to the owner's Google Sheet. Already-onboarded visitors skip the modal
 * but still get a once-per-session "visit" ping.
 */
export default function NameGate() {
  const hydrated = useHydrated();
  const hasOnboarded = useHasOnboarded();
  const userName = useUserName();
  const { completeOnboarding } = useUIActions();

  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Returning visitor: record the session once we know who they are.
  useEffect(() => {
    if (!hydrated || !hasOnboarded) return;
    logVisitOncePerSession(userName || "(unnamed)");
  }, [hydrated, hasOnboarded, userName]);

  // Focus the field as soon as the gate appears.
  useEffect(() => {
    if (hydrated && !hasOnboarded) inputRef.current?.focus();
  }, [hydrated, hasOnboarded]);

  // Don't render until hydrated (avoids SSR/localStorage mismatch) or if the
  // visitor is already onboarded.
  if (!hydrated || hasOnboarded) return null;

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    completeOnboarding(trimmed);
    // Log "joined", then mark the session so the visit effect won't double-log.
    logVisitor("joined", trimmed);
    markSessionLogged();
  };

  return (
    // A required gate: no Esc / backdrop dismiss — entering a name is the only
    // way through. role="dialog" + aria-modal keeps it accessible.
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="namegate-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-7 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
          <Sparkles size={20} />
        </div>

        <h2
          id="namegate-title"
          className="mt-4 text-[20px] font-semibold text-zinc-50"
        >
          Welcome to JMind
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-zinc-400">
          Your personal space to think, plan, and execute. What should we call
          you?
        </p>

        <form
          className="mt-6 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={MAX_NAME_LENGTH}
            autoComplete="name"
            aria-label="Your name"
            className="h-11 w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3.5 text-[14px] text-zinc-100 outline-none transition-all placeholder:text-zinc-600 focus:border-emerald-500/40 focus:bg-zinc-950 focus:ring-2 focus:ring-emerald-400/10"
          />
          <Button type="submit" size="lg" disabled={!canSubmit} className="w-full">
            Continue
          </Button>
        </form>

        <p className="mt-4 text-[11px] leading-relaxed text-zinc-600">
          Just a name so we can greet you — no password, no email.
        </p>
      </div>
    </div>
  );
}

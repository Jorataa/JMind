"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/ui/Logo";
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
 * the UI store (which drives the dashboard greeting + rail), and logs the
 * entry to the owner's Google Sheet. Already-onboarded visitors skip the modal
 * but still get a once-per-session "visit" ping.
 *
 * On "/" the landing page owns onboarding, so the gate stays out of the way.
 */
export default function NameGate() {
  const hydrated = useHydrated();
  const hasOnboarded = useHasOnboarded();
  const userName = useUserName();
  const { completeOnboarding } = useUIActions();
  const pathname = usePathname();

  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const onLanding = pathname === "/";

  // Returning visitor: record the session once we know who they are.
  useEffect(() => {
    if (!hydrated || !hasOnboarded) return;
    logVisitOncePerSession(userName || "(unnamed)");
  }, [hydrated, hasOnboarded, userName]);

  // Focus the field as soon as the gate appears.
  useEffect(() => {
    if (hydrated && !hasOnboarded && !onLanding) inputRef.current?.focus();
  }, [hydrated, hasOnboarded, onLanding]);

  // Don't render until hydrated (avoids SSR/localStorage mismatch), if the
  // visitor is already onboarded, or on the landing page (it owns this step).
  if (!hydrated || hasOnboarded || onLanding) return null;

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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(27,41,31,0.4)] p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="namegate-title"
    >
      <div className="w-full max-w-md rounded-card border border-line-hair bg-card p-7 shadow-float-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-inner bg-sage-surface text-emerald-500">
          <LogoMark size={24} title="Jorata" />
        </div>

        <h2
          id="namegate-title"
          className="mt-4 font-serif text-[26px] leading-[1.15] text-ink-900"
        >
          Welcome to Jorata
        </h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-600">
          A quiet place to think, plan, and get things done. What should we
          call you?
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
            className="h-11 w-full rounded-inner border border-line-strong bg-card px-4 text-[14.5px] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-emerald-500"
          />
          <Button type="submit" variant="accent" size="lg" disabled={!canSubmit} className="w-full">
            Continue
          </Button>
        </form>

        <p className="mt-4 text-[11.5px] leading-relaxed text-ink-500">
          Just a name so we can greet you — no password, no email.
        </p>
      </div>
    </div>
  );
}

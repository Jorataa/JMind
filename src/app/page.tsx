"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Waypoints, CheckSquare, Sparkles, ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/ui/Logo";
import { Constellation } from "@/components/ui/ContourArt";
import { useHydrated } from "@/hooks/use-hydrated";
import { useHasOnboarded, useUIActions } from "@/stores/use-ui-store";
import { logVisitor, markSessionLogged } from "@/lib/visitor-log";
import { THEMES } from "@/hooks/use-theme";

/**
 * Landing (design handoff §7): paper, serif hero, and the signup line —
 * "What should we call you?" — as the front door. Returning users never see
 * this page; they go straight to the Dashboard.
 */
export default function RootPage() {
  const hydrated = useHydrated();
  const hasOnboarded = useHasOnboarded();
  const { completeOnboarding } = useUIActions();
  const router = useRouter();
  const [name, setName] = useState("");

  useEffect(() => {
    if (hydrated && hasOnboarded) router.replace("/dashboard");
  }, [hydrated, hasOnboarded, router]);

  // Quiet paper while we decide (or while redirecting a returning user).
  if (!hydrated || hasOnboarded) {
    return <div className="min-h-screen bg-paper" aria-hidden />;
  }

  const begin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    completeOnboarding(trimmed);
    logVisitor("joined", trimmed);
    markSessionLogged();
    router.push("/dashboard");
  };

  return (
    <div className="custom-scrollbar min-h-screen overflow-y-auto bg-paper text-ink-700">
      <div className="mx-auto flex min-h-screen max-w-[1080px] flex-col px-6 md:px-10">
        {/* Nav */}
        <header className="flex items-center gap-2.5 pt-8">
          <LogoMark size={27} className="text-emerald-500" title="Jorata" />
          <span className="font-serif text-[22px] text-ink-900">Jorata</span>
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-[13px] text-ink-600 transition-colors hover:text-ink-900"
          >
            Open Jorata →
          </button>
        </header>

        {/* Hero */}
        <main className="flex flex-1 flex-col justify-center py-16">
          <p className="text-[11.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
            A thinking &amp; execution workspace
          </p>
          <h1 className="mt-4 max-w-[15ch] font-serif text-[44px] leading-[1.06] text-ink-900 md:text-[68px]">
            A quiet place to <em className="italic text-green-800">think</em> — and an
            engine to <em className="italic text-green-800">act.</em>
          </h1>
          <p className="mt-5 max-w-[52ch] text-[15.5px] leading-relaxed text-ink-600">
            Map your thinking on an endless canvas, let the AI grow branches you
            keep or discard, and turn the good ones into calm, honest execution.
            Local-first — your data stays yours.
          </p>

          {/* The signup line (§7): one name, nothing else. */}
          <form onSubmit={begin} className="mt-9 max-w-[460px]">
            <p className="font-serif text-[17px] italic text-ink-700">
              What should we call you?
            </p>
            <div className="mt-2.5 flex items-center gap-2 rounded-[16px] border border-line-strong bg-card p-2 pl-4 shadow-float-1 transition-colors focus-within:border-emerald-500">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={40}
                autoComplete="name"
                aria-label="Your name"
                className="w-full bg-transparent text-[15.5px] text-ink-900 placeholder:text-ink-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!name.trim()}
                className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-emerald-500 px-5 text-[13.5px] font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-40"
              >
                Begin
                <ArrowRight size={14} />
              </button>
            </div>
            <p className="mt-2.5 text-[11.5px] text-ink-500">
              No password, no email — just a name so we can greet you.
            </p>
          </form>
        </main>

        {/* Product frame — a stylized glance, not a screenshot. */}
        <section aria-hidden className="relative overflow-hidden rounded-card border border-line-strong bg-card p-3 shadow-float-2">
          <div className="flex gap-3">
            {/* rail */}
            <div className="relative hidden w-[120px] shrink-0 flex-col gap-2 overflow-hidden rounded-inner bg-evergreen-950 p-3 sm:flex">
              <div className="flex items-center gap-1.5">
                <LogoMark size={14} className="text-emerald-500" />
                <span className="font-serif text-[12px] text-rail-bright">Jorata</span>
              </div>
              <div className="mt-2 h-[18px] rounded-[6px] bg-sage-surface" />
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[14px] w-4/5 rounded-[5px] bg-[rgba(233,237,224,0.1)]" />
              ))}
              <div className="mt-auto h-[20px] rounded-[7px] bg-emerald-500/90" />
            </div>
            {/* bento sketch */}
            <div className="grid min-w-0 flex-1 grid-cols-6 gap-2">
              <div className="relative col-span-6 row-span-2 min-h-[130px] overflow-hidden rounded-inner bg-evergreen-950 p-4 md:col-span-3">
                <Constellation size={170} className="absolute -right-5 -top-3 opacity-80" />
                <div className="h-2 w-16 rounded-full bg-[rgba(233,237,224,0.25)]" />
                <div className="mt-3 h-2.5 w-4/5 rounded-full bg-[rgba(233,237,224,0.5)]" />
                <div className="mt-1.5 h-2.5 w-3/5 rounded-full bg-emerald-300/70" />
                <div className="absolute bottom-4 left-4 right-4 h-8 rounded-[9px] border border-[rgba(233,237,224,0.14)] bg-[rgba(233,237,224,0.08)]" />
              </div>
              <div className="col-span-3 min-h-[60px] rounded-inner border border-line-hair bg-paper p-3 md:col-span-2">
                <div className="h-2 w-12 rounded-full bg-sunken" />
                <div className="mt-2 h-2 w-4/5 rounded-full bg-line-hair" />
                <div className="mt-1.5 h-2 w-3/5 rounded-full bg-line-hair" />
              </div>
              <div className="col-span-3 min-h-[60px] rounded-inner bg-sage-surface p-3 md:col-span-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <div className="mt-2 h-2 w-4/5 rounded-full bg-sage-border" />
                <div className="mt-1.5 h-2 w-2/3 rounded-full bg-sage-border" />
              </div>
              <div className="col-span-6 flex min-h-[46px] items-center gap-2 rounded-inner border border-line-hair bg-paper px-3 md:col-span-3">
                <div className="h-3.5 w-3.5 rounded-[4px] border-[1.5px] border-ink-400" />
                <div className="h-2 w-1/2 rounded-full bg-line-strong" />
                <div className="ml-auto h-4 w-12 rounded-full bg-clay-bg" />
              </div>
              <div className="col-span-6 flex min-h-[46px] items-center gap-2 rounded-inner border border-line-hair bg-paper px-3 md:col-span-3">
                <div className="h-3.5 w-3.5 rounded-[4px] border-[1.5px] border-emerald-500 bg-emerald-500" />
                <div className="h-2 w-2/5 rounded-full bg-line-hair" />
                <div className="ml-auto h-4 w-14 rounded-full bg-sage-surface" />
              </div>
            </div>
          </div>
        </section>

        {/* Feature rows */}
        <section className="grid gap-10 py-16 md:grid-cols-3">
          <Feature
            icon={<Waypoints size={17} strokeWidth={1.9} />}
            title="Think in maps"
            body="Start with one question. Grow it by hand or let Jorata propose branches — sage and dashed until you keep them."
          />
          <Feature
            icon={<CheckSquare size={17} strokeWidth={1.9} />}
            title="Execute lightly"
            body="Ideas become tasks with energy, not deadlines-for-everything. One focus a day, done when it's done."
          />
          <Feature
            icon={<Sparkles size={17} strokeWidth={1.9} />}
            title="An assistant that notices"
            body="Quiet observations — an overdue thread, a map gone silent — never toasts, never guilt."
          />
        </section>

        {/* Themes strip */}
        <section className="flex flex-col items-center gap-3 border-t border-line-soft py-10">
          <div className="flex items-center gap-2.5">
            {THEMES.map((t) => (
              <span
                key={t.id}
                className="h-4 w-4 rounded-full border border-line-strong"
                style={{ backgroundColor: t.accent }}
                title={t.label}
              />
            ))}
          </div>
          <p className="text-[12.5px] text-ink-500">
            Five quiet accents — pick your green in Settings.
          </p>
        </section>

        {/* Footer */}
        <footer className="flex items-center gap-2 border-t border-line-soft py-8 text-[12px] text-ink-500">
          <LogoMark size={15} className="text-emerald-500" />
          <span>Jorata</span>
          <span className="text-ink-400">·</span>
          <span>local-first — your data stays on your device</span>
          <span className="flex-1" />
          <span className="font-mono text-[10.5px] text-ink-400">
            think → plan → execute
          </span>
        </footer>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-surface text-green-800">
        {icon}
      </div>
      <h3 className="mt-3 font-serif text-[20px] text-ink-900">{title}</h3>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-600">{body}</p>
    </div>
  );
}

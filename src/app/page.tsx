"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Waypoints, CheckSquare, Sparkles } from "lucide-react";
import { LogoMark } from "@/components/ui/Logo";
import { useHydrated } from "@/hooks/use-hydrated";
import { useHasOnboarded, useUIActions } from "@/stores/use-ui-store";
import { logVisitor, markSessionLogged } from "@/lib/visitor-log";
import { THEMES } from "@/hooks/use-theme";

/**
 * Editorial Landing Page — Art Directed & Human Centered.
 *
 * Uses the real Dolomite mountain ridge photography (/brand-landscape.webp)
 * as an authentic visual anchor. Eliminates AI-slop patterns (glowing blobs,
 * purple gradients, fake floaters, 3D icons, crowded card grids).
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
    <div className="custom-scrollbar min-h-screen bg-paper text-ink-700 antialiased selection:bg-emerald-500/20">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-40 border-b border-line-soft bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-4 md:px-10">
          <div className="flex items-center gap-3">
            <LogoMark size={24} className="text-emerald-500" title="Jorata" />
            <span className="font-serif text-[21px] tracking-tight text-ink-900">
              Jorata
            </span>
            <span className="hidden font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-500 sm:inline-block">
              · Vol. I
            </span>
          </div>

          <div className="flex items-center gap-5">
            <span className="hidden font-mono text-[11px] text-ink-500 md:inline-block">
              Think → Plan → Execute
            </span>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="group inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-card px-4 py-1.5 text-[13px] font-medium text-ink-900 transition-colors hover:border-emerald-500 hover:bg-white"
            >
              Open Workspace
              <ArrowRight
                size={13}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-6 md:px-10">
        {/* ── Hero Section: Asymmetric Editorial Composition ── */}
        <section className="py-12 md:py-20 lg:py-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
            {/* Left Narrative Column */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-line-hair bg-sunken/60 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Personal Operating System
              </div>

              <h1 className="mt-6 font-serif text-[42px] leading-[1.05] tracking-tight text-ink-900 sm:text-[56px] md:text-[66px]">
                A quiet place to <em className="italic text-green-800">think</em> —
                and an engine to <em className="italic text-green-800">act.</em>
              </h1>

              <p className="mt-6 max-w-[54ch] text-[16px] leading-relaxed text-ink-600 md:text-[17.5px]">
                Map ideas infinitely on a calm canvas, let AI propose gentle branches,
                and convert clarity into focused daily work. Local-first architecture —
                your thoughts remain entirely your own.
              </p>

              {/* Onboarding Input Line */}
              <form onSubmit={begin} className="mt-10 max-w-[480px]">
                <label
                  htmlFor="user-name-input"
                  className="block font-serif text-[18px] italic text-ink-800"
                >
                  What should we call you?
                </label>
                <div className="mt-3 flex items-center gap-2 rounded-[14px] border border-line-strong bg-card p-2 pl-4 shadow-float-1 transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10">
                  <input
                    id="user-name-input"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={40}
                    autoComplete="name"
                    aria-label="Your name"
                    className="w-full bg-transparent text-[15.5px] text-ink-900 placeholder:text-ink-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!name.trim()}
                    className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-evergreen-900 px-5 text-[13.5px] font-medium text-[#E9EDE0] transition-colors hover:bg-evergreen-deep disabled:opacity-40"
                  >
                    Begin
                    <ArrowRight size={14} />
                  </button>
                </div>
                <p className="mt-2.5 flex items-center gap-2 font-mono text-[11px] text-ink-500">
                  <span>No account creation</span>
                  <span>·</span>
                  <span>Instant browser storage</span>
                  <span>·</span>
                  <span>Free forever</span>
                </p>
              </form>
            </div>

            {/* Right Editorial Photograph Plate */}
            <div className="lg:col-span-5">
              <div className="group relative overflow-hidden rounded-[16px] border border-line-strong bg-card p-2.5 shadow-float-2">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[12px] bg-sunken">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brand-landscape.webp"
                    alt="Silent mountain ridge in misty dawn"
                    className="h-full w-full object-cover object-[50%_40%] transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    loading="eager"
                  />
                  {/* Subtle top/bottom frame hairline */}
                  <div className="pointer-events-none absolute inset-0 border border-black/5" />
                </div>
                <div className="mt-3 flex items-center justify-between px-1.5 py-0.5">
                  <span className="font-serif text-[13px] italic text-ink-800">
                    Dolomite Ridge at Dawn
                  </span>
                  <span className="font-mono text-[10.5px] text-ink-500">
                    46.5° N · 11.8° E
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 02: Full-Bleed Monograph Horizon ── */}
        <section className="my-12 border-y border-line-soft py-14">
          <div className="relative overflow-hidden rounded-[20px] border border-line-strong bg-evergreen-950 text-[#E9EDE0]">
            <div className="relative aspect-[21/9] min-h-[300px] w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand-landscape.webp"
                alt="Horizon view"
                className="h-full w-full object-cover opacity-85 object-[50%_35%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-evergreen-950 via-evergreen-950/20 to-transparent" />
            </div>

            <div className="relative z-10 flex flex-col justify-between p-8 sm:p-12 md:p-16">
              <div className="max-w-[700px]">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-rail-faint">
                  02 · Spatial Thinking
                </p>
                <h2 className="mt-4 font-serif text-[32px] leading-[1.12] text-rail-bright sm:text-[44px]">
                  “Clarity comes when thoughts are given space to align.”
                </h2>
                <p className="mt-4 max-w-[50ch] text-[15px] leading-relaxed text-rail-muted">
                  Unlike rigid document trees or endless linear feeds, Jorata allows
                  ideas to grow visually in non-linear nodes—exactly how the human brain naturally reflects.
                </p>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-8 border-t border-[rgba(233,237,224,0.12)] pt-6 font-mono text-[11.5px] text-rail-faint">
                <div>
                  <span className="block font-sans text-[18px] font-semibold text-rail-bright">
                    Infinite
                  </span>
                  Visual Mind Canvas
                </div>
                <div>
                  <span className="block font-sans text-[18px] font-semibold text-rail-bright">
                    Zero
                  </span>
                  Cloud Lock-In
                </div>
                <div>
                  <span className="block font-sans text-[18px] font-semibold text-rail-bright">
                    100%
                  </span>
                  Private &amp; Offline
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 03: Three Core Pillars ── */}
        <section className="py-16">
          <div className="mb-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-500">
              03 · Architecture
            </p>
            <h2 className="mt-2 font-serif text-[36px] text-ink-900 md:text-[44px]">
              Three quiet principles.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            <PillarCard
              num="01"
              icon={<Waypoints size={18} strokeWidth={1.8} />}
              title="Think in Maps"
              body="Start with a single prompt or question. Expand branches manually or let the integrated AI propose next nodes with dashed, sage borders."
            />
            <PillarCard
              num="02"
              icon={<CheckSquare size={18} strokeWidth={1.8} />}
              title="Execute Lightly"
              body="Convert map nodes into actionable tasks with energy tags. One daily focus anchor ensures continuous movement without overwhelm."
            />
            <PillarCard
              num="03"
              icon={<Sparkles size={18} strokeWidth={1.8} />}
              title="An Assistant That Notices"
              body="Quiet observations point out stale maps or overdue threads. Never guilt-tripping notifications—just respectful awareness."
            />
          </div>
        </section>

        {/* ── Section 04: Real Interface Workspace Frame ── */}
        <section className="py-14">
          <div className="rounded-[20px] border border-line-strong bg-card p-4 shadow-float-2 md:p-6">
            <div className="mb-4 flex items-center justify-between border-b border-line-soft pb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400/60" />
                <span className="h-3 w-3 rounded-full bg-amber-400/60" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/60" />
                <span className="ml-2 font-serif text-[14px] text-ink-800">
                  Jorata — Workspace
                </span>
              </div>
              <span className="font-mono text-[11px] text-ink-500">
                Interactive Canvas Preview
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              {/* Left Mini Rail preview */}
              <div className="hidden rounded-[12px] bg-evergreen-950 p-4 text-[#E9EDE0] md:col-span-3 md:block">
                <div className="flex items-center gap-2">
                  <LogoMark size={16} className="text-emerald-500" />
                  <span className="font-serif text-[14px]">Jorata</span>
                </div>
                <div className="mt-6 flex flex-col gap-2 font-sans text-[12.5px] text-rail-muted">
                  <div className="rounded-[8px] bg-sage-surface px-3 py-1.5 font-medium text-evergreen-950">
                    Dashboard
                  </div>
                  <div className="px-3 py-1.5">Workspace Map</div>
                  <div className="px-3 py-1.5">Daily Tasks</div>
                  <div className="px-3 py-1.5">Knowledge</div>
                </div>
              </div>

              {/* Main Mind Map Canvas Preview */}
              <div className="relative min-h-[260px] rounded-[12px] border border-line-hair bg-paper p-6 canvas-dotgrid md:col-span-9 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full border border-green-800/20 bg-sage-surface/60 px-3 py-1 text-[12px] font-medium text-green-800">
                    Active Map: Product Strategy 2026
                  </div>
                  <span className="font-mono text-[11px] text-ink-500">
                    12 Nodes Connected
                  </span>
                </div>

                <div className="my-8 flex flex-wrap items-center justify-center gap-4 text-center">
                  <div className="rounded-[12px] border border-line-strong bg-card px-5 py-3 shadow-sm font-serif text-[16px] text-ink-900">
                    Core Product Vision
                  </div>
                  <div className="text-emerald-600 font-mono">────→</div>
                  <div className="rounded-[12px] border border-emerald-500/40 bg-emerald-50/50 px-5 py-3 shadow-sm font-serif text-[16px] text-green-800">
                    Endless Mind Canvas
                  </div>
                  <div className="text-emerald-600 font-mono">────→</div>
                  <div className="rounded-[12px] border border-dashed border-sage-dash bg-sage-surface/40 px-5 py-3 font-serif text-[16px] text-ink-700">
                    Daily Focused Anchor
                  </div>
                </div>

                <div className="flex items-center justify-between text-[12px] text-ink-500">
                  <span>Pan &amp; Zoom ready</span>
                  <span className="font-mono">⌘ + Scroll to zoom</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 05: Color Palette & Natural Themes ── */}
        <section className="my-12 border-t border-line-soft py-12 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-500">
            05 · Natural Color Palette
          </p>
          <p className="mt-2 font-serif text-[22px] text-ink-900">
            Five quiet earth accents derived from nature.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
            {THEMES.map((theme) => (
              <div key={theme.id} className="flex items-center gap-2.5 rounded-full border border-line-hair bg-card px-4 py-2 shadow-sm">
                <span
                  className="h-3.5 w-3.5 rounded-full"
                  style={{ backgroundColor: theme.accent }}
                />
                <span className="text-[13px] font-medium text-ink-800">
                  {theme.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Editorial Footer ── */}
      <footer className="border-t border-line-soft bg-paper py-12">
        <div className="mx-auto max-w-[1240px] px-6 md:px-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <LogoMark size={20} className="text-emerald-500" />
                <span className="font-serif text-[18px] text-ink-900">Jorata</span>
                <span className="font-mono text-[11px] text-ink-500">
                  · Local-first OS
                </span>
              </div>
              <p className="mt-2 max-w-[40ch] text-[13px] text-ink-600">
                A quiet space to think and an engine to act. Designed for human focus.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-[13px] text-ink-600">
              <Link href="/privacy" className="transition-colors hover:text-ink-900">
                Privacy
              </Link>
              <Link href="/cookies" className="transition-colors hover:text-ink-900">
                Cookies
              </Link>
              <Link href="/terms" className="transition-colors hover:text-ink-900">
                Terms
              </Link>
              <Link href="/copyright" className="transition-colors hover:text-ink-900">
                Copyright
              </Link>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-2 border-t border-line-soft pt-6 font-mono text-[11px] text-ink-500 sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 Jorata Inc. All rights reserved.</span>
            <span>think → plan → execute → measure → improve</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PillarCard({
  num,
  icon,
  title,
  body,
}: {
  num: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col justify-between rounded-[16px] border border-line-hair bg-card p-6 shadow-sm transition-all hover:border-line-strong">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-surface text-green-800">
            {icon}
          </div>
          <span className="font-mono text-[11px] text-ink-400">{num}</span>
        </div>
        <h3 className="mt-5 font-serif text-[22px] text-ink-900">{title}</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-600">{body}</p>
      </div>
    </div>
  );
}


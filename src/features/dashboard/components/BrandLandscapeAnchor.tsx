"use client";

import Link from "next/link";
import { Compass, Sparkles } from "lucide-react";

interface BrandLandscapeAnchorProps {
  className?: string;
}

/**
 * BrandLandscapeAnchor — The environmental visual anchor of Jorata.
 *
 * Visibly renders the golden-hour coastal landscape photograph as a spacious,
 * deliberate editorial plate on the dashboard. Provides perspective and quiet
 * breathing room alongside functional workspace widgets.
 */
export default function BrandLandscapeAnchor({ className = "" }: BrandLandscapeAnchorProps) {
  return (
    <section
      aria-label="Environmental Visual Anchor"
      className={`group relative overflow-hidden rounded-card border border-line-strong bg-card shadow-float-1 transition-all hover:border-emerald-500/30 ${className}`}
    >
      <div className="relative aspect-[16/8] min-h-[220px] w-full overflow-hidden bg-sunken sm:aspect-[21/9] lg:aspect-[24/8]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand-landscape.webp"
          alt="Golden-hour coastal mountains and ocean"
          className="h-full w-full object-cover object-[50%_45%] transition-transform duration-1000 ease-out group-hover:scale-[1.015]"
          loading="eager"
        />
        {/* Hairline subtle inner frame for editorial precision */}
        <div className="pointer-events-none absolute inset-0 border border-black/5" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

        {/* Quiet overlay metadata & reflection typography */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-5 text-white sm:p-7 md:p-8">
          <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-white/80">
            <Compass size={12} className="text-emerald-300" />
            <span>36.2° N · 121.8° W · Big Sur Coastline</span>
          </div>

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <p className="max-w-[62ch] font-serif text-[18px] leading-snug italic text-white/95 sm:text-[22px]">
              “Perspective is the quiet foundation of intentional work.”
            </p>

            <Link
              href="/mindmap"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[12.5px] font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <Sparkles size={12} />
              Open Sanctuary Canvas →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

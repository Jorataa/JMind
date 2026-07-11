"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Page header grammar (design handoff §6.2).
 * Left: caps context line over a serif title (italic clause in green done by
 * the caller via <em>). Right: baseline-aligned controls — segmented pill,
 * outline button(s), one dark primary.
 */
interface PageHeaderProps {
  /** Caps date/context line, e.g. "THURSDAY, JULY 10" or "TASKS — WEEK OF JULY 6". */
  context: string;
  /** Serif title. Use <em> for the italic green clause. */
  title: ReactNode;
  /** Right-side controls. */
  actions?: ReactNode;
  /** display = Dashboard greeting (46px) · h1 = page titles (40px) · h2 = dense pages (34px). */
  size?: "display" | "h1" | "h2";
  className?: string;
}

const TITLE_SIZE = {
  display: "text-[34px] md:text-[46px] leading-[1.08]",
  h1: "text-[28px] md:text-[40px] leading-[1.1]",
  h2: "text-[26px] md:text-[34px] leading-[1.08]",
};

export default function PageHeader({
  context,
  title,
  actions,
  size = "h1",
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-6 gap-y-4",
        className
      )}
    >
      <div className="min-w-0">
        <p className="text-[11.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
          {context}
        </p>
        <h1
          className={cn(
            "mt-1.5 font-serif text-ink-900 [&_em]:not-italic [&_em]:font-serif [&_em]:italic [&_em]:text-green-800",
            TITLE_SIZE[size]
          )}
        >
          {title}
        </h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </header>
  );
}

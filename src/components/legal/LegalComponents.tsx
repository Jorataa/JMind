"use client";

import React from "react";
import { cn } from "@/lib/cn";
import { ShieldCheck, Info, AlertCircle, FileText } from "lucide-react";
import { LEGAL_CONSTANTS } from "./constants";

export interface LegalSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function LegalSection({ id, title, children, className }: LegalSectionProps) {
  return (
    <section id={id} className={cn("scroll-mt-24 pb-10 border-b border-line-soft last:border-0", className)}>
      <h2 className="font-serif text-[24px] font-normal text-ink-900 tracking-tight mb-4">
        {title}
      </h2>
      <div className="flex flex-col gap-4 text-[14.5px] leading-relaxed text-ink-700 max-w-[68ch]">
        {children}
      </div>
    </section>
  );
}

export interface LegalHeadingProps {
  level?: 3 | 4;
  children: React.ReactNode;
  className?: string;
}

export function LegalHeading({ level = 3, children, className }: LegalHeadingProps) {
  if (level === 3) {
    return (
      <h3 className={cn("font-sans text-[16px] font-semibold text-ink-900 mt-4 mb-1", className)}>
        {children}
      </h3>
    );
  }
  return (
    <h4 className={cn("font-sans text-[14px] font-semibold text-ink-900 mt-3 mb-1", className)}>
      {children}
    </h4>
  );
}

export interface LegalCalloutProps {
  type?: "info" | "shield" | "warning";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function LegalCallout({ type = "shield", title, children, className }: LegalCalloutProps) {
  const icons = {
    info: <Info size={18} className="text-emerald-600 shrink-0 mt-0.5" />,
    shield: <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />,
    warning: <AlertCircle size={18} className="text-ochre-700 shrink-0 mt-0.5" />,
  };

  const bgStyles = {
    info: "bg-sage-surface/60 border-sage-border text-ink-900",
    shield: "bg-sage-surface/60 border-sage-border text-ink-900",
    warning: "bg-sunken border-line-strong text-ink-900",
  };

  return (
    <div
      className={cn(
        "my-4 flex gap-3.5 rounded-inner border p-4 text-[13.5px] leading-relaxed",
        bgStyles[type],
        className
      )}
    >
      {icons[type]}
      <div className="flex min-w-0 flex-col gap-1">
        {title && <h5 className="font-semibold text-ink-900 text-[14px]">{title}</h5>}
        <div className="text-ink-700">{children}</div>
      </div>
    </div>
  );
}

export interface LegalTableProps {
  headers: string[];
  rows: (string | React.ReactNode)[][];
  className?: string;
}

export function LegalTable({ headers, rows, className }: LegalTableProps) {
  return (
    <div className={cn("my-4 w-full overflow-x-auto rounded-inner border border-line-hair bg-card", className)}>
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-line-hair bg-sunken/60 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">
            {headers.map((h, idx) => (
              <th key={idx} className="px-4 py-2.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft text-ink-700">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-sunken/30 transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-4 py-3 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LastUpdatedBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-line-hair bg-sunken/80 px-3 py-1 text-[11.5px] text-ink-600 font-mono">
      <FileText size={12} className="text-ink-500" />
      <span>Last updated: {LEGAL_CONSTANTS.LAST_UPDATED}</span>
    </div>
  );
}

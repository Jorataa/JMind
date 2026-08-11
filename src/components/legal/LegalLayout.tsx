"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/ui/Logo";
import { LEGAL_TABS, LEGAL_CONSTANTS } from "./constants";
import { LastUpdatedBadge } from "./LegalComponents";
import { cn } from "@/lib/cn";
import { ArrowLeft, Shield, ChevronRight, X } from "lucide-react";

export interface LegalTocItem {
  id: string;
  label: string;
}

export interface LegalLayoutProps {
  title: string;
  subtitle: string;
  activeTab: "privacy" | "terms" | "copyright" | "cookies";
  tocSections: LegalTocItem[];
  children: React.ReactNode;
}

export function LegalLayout({
  title,
  subtitle,
  activeTab,
  tocSections,
  children,
}: LegalLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>(
    tocSections[0]?.id || ""
  );
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  // Set up IntersectionObserver for scroll-spy active section highlighting
  useEffect(() => {
    if (!tocSections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0.1,
      }
    );

    tocSections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [tocSections]);

  return (
    <div className="min-h-screen bg-paper text-ink-700 font-sans custom-scrollbar">
      {/* ── Top Header Bar ── */}
      <header className="sticky top-0 z-40 border-b border-line-hair bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-ink-900 transition-opacity hover:opacity-80"
            >
              <LogoMark size={24} className="text-emerald-500" />
              <span className="font-serif text-[20px] font-normal tracking-tight">
                {LEGAL_CONSTANTS.PRODUCT_NAME}
              </span>
            </Link>
            <span className="text-ink-400">/</span>
            <span className="text-[13px] font-medium text-ink-600">Legal &amp; Trust</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 text-[13px] text-ink-600 hover:text-ink-900 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 rounded-full border border-line-hair bg-card px-3 py-1 text-[12px] font-medium text-ink-700 hover:border-line-strong transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero & Navigation Tabs ── */}
      <div className="border-b border-line-hair bg-card/60 pt-10 pb-6">
        <div className="mx-auto max-w-[1180px] px-5 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-[720px]">
              <div className="mb-2 flex items-center gap-2">
                <Shield size={16} className="text-emerald-600" />
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-500">
                  Trust &amp; Transparency
                </span>
              </div>
              <h1 className="font-serif text-[32px] md:text-[42px] font-normal leading-[1.1] text-ink-900">
                {title}
              </h1>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
                {subtitle}
              </p>
            </div>
            <div className="shrink-0">
              <LastUpdatedBadge />
            </div>
          </div>

          {/* ── Tabs Row ── */}
          <nav aria-label="Legal Documents" className="mt-8 flex gap-1 overflow-x-auto pb-1 scrollbar-none">
            {LEGAL_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-4 py-2 text-[13.5px] font-medium transition-all duration-150",
                    isActive
                      ? "bg-evergreen-950 text-rail-bright shadow-float-1"
                      : "text-ink-600 hover:bg-sunken hover:text-ink-900"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Main Layout Body ── */}
      <div className="mx-auto max-w-[1180px] px-5 py-8 md:px-8 md:py-12">
        {/* Mobile TOC Toggle */}
        <div className="mb-6 md:hidden">
          <button
            type="button"
            onClick={() => setMobileTocOpen(!mobileTocOpen)}
            className="flex w-full items-center justify-between rounded-inner border border-line-hair bg-card px-4 py-2.5 text-[13px] font-medium text-ink-800"
          >
            <span>On this page: {tocSections.find((s) => s.id === activeSection)?.label || "Overview"}</span>
            {mobileTocOpen ? <X size={16} /> : <ChevronRight size={16} />}
          </button>

          {mobileTocOpen && (
            <div className="mt-2 rounded-inner border border-line-hair bg-card p-3 shadow-float-1">
              <ul className="flex flex-col gap-1">
                {tocSections.map((sec) => (
                  <li key={sec.id}>
                    <a
                      href={`#${sec.id}`}
                      onClick={() => setMobileTocOpen(false)}
                      className={cn(
                        "block rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                        activeSection === sec.id
                          ? "bg-sage-surface font-semibold text-green-800"
                          : "text-ink-600 hover:bg-sunken hover:text-ink-900"
                      )}
                    >
                      {sec.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-12">
          {/* ── Desktop TOC Sidebar ── */}
          <aside className="hidden w-[220px] shrink-0 md:block">
            <div className="sticky top-24 flex flex-col gap-4">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
                Contents
              </p>
              <ul className="flex flex-col gap-[2px] text-[13px]">
                {tocSections.map((sec) => {
                  const isActive = activeSection === sec.id;
                  return (
                    <li key={sec.id}>
                      <a
                        href={`#${sec.id}`}
                        className={cn(
                          "block rounded-lg px-3 py-2 leading-tight transition-colors duration-150",
                          isActive
                            ? "bg-sage-surface font-semibold text-green-800"
                            : "text-ink-600 hover:bg-sunken hover:text-ink-900"
                        )}
                      >
                        {sec.label}
                      </a>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 rounded-inner border border-line-hair bg-card p-3.5 text-[12px] leading-relaxed text-ink-600">
                <p className="font-semibold text-ink-900 mb-1">Local-First Guarantee</p>
                Your data stays stored in your browser by default. You retain complete ownership of everything you write or create in Jorata.
              </div>
            </div>
          </aside>

          {/* ── Main Document Content ── */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-line-soft bg-card/40 py-10">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-4 px-5 text-[12.5px] text-ink-500 md:flex-row md:px-8">
          <div className="flex items-center gap-2">
            <LogoMark size={16} className="text-emerald-500" />
            <span className="font-serif text-[14px] text-ink-900">Jorata</span>
            <span>· Personal Operating System</span>
          </div>

          <div className="flex items-center gap-4 text-[12px]">
            {LEGAL_TABS.map((tab) => (
              <Link key={tab.id} href={tab.href} className="hover:text-ink-900 transition-colors">
                {tab.label}
              </Link>
            ))}
          </div>

          <p className="text-[11.5px] text-ink-400">
            © {new Date().getFullYear()} Jorata. Think → Plan → Execute.
          </p>
        </div>
      </footer>
    </div>
  );
}

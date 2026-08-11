"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useConsentStore, useConsentActions } from "@/stores/use-consent-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { Button } from "@/components/ui/Button";
import { Shield, X } from "lucide-react";

export function CookieBanner() {
  const hydrated = useHydrated();
  const hasResponded = useConsentStore((state) => state.hasResponded);
  const { acceptAll, rejectNonEssential } = useConsentActions();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hydrated && !hasResponded) {
      // Gentle delay so it doesn't slam the user on initial frame
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [hydrated, hasResponded]);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookies and Privacy Consent"
      className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-[620px] rounded-card border border-line-strong bg-card p-4 shadow-float-3 transition-all duration-300 md:bottom-6 md:left-6 md:right-auto md:w-[580px]"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-surface text-green-800">
          <Shield size={16} />
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <h4 className="font-serif text-[16px] font-normal text-ink-900">
              Cookies &amp; Local Storage
            </h4>
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="rounded p-1 text-ink-400 hover:text-ink-900 transition-colors"
              aria-label="Dismiss cookie message"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-[12.5px] leading-relaxed text-ink-600">
            Jorata uses local browser storage to save your mind maps, tasks, and settings locally. Where enabled, we log minimal, anonymous visitor pings to improve the product. We never sell your data or read your private thoughts.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                acceptAll();
                setVisible(false);
              }}
            >
              Accept all
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                rejectNonEssential();
                setVisible(false);
              }}
            >
              Reject non-essential
            </Button>
            <Link
              href="/cookies"
              onClick={() => setVisible(false)}
              className="px-2 py-1 text-[12px] text-ink-600 underline hover:text-ink-900 transition-colors"
            >
              Manage preferences
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useConsentStore, useConsentActions } from "@/stores/use-consent-store";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/stores/use-toast-store";
import { Check, Shield, Database, BarChart2, Sliders } from "lucide-react";
import { cn } from "@/lib/cn";

export function CookiePreferences() {
  const addToast = useToast();
  const consent = useConsentStore();
  const { setPreferences, acceptAll, rejectNonEssential } = useConsentActions();

  const [prefsState, setPrefsState] = useState(consent.preferences);
  const [analyticsState, setAnalyticsState] = useState(consent.analytics);

  const handleSave = () => {
    setPreferences({ preferences: prefsState, analytics: analyticsState });
    addToast("Cookie & privacy preferences saved", "success");
  };

  const handleAcceptAll = () => {
    acceptAll();
    setPrefsState(true);
    setAnalyticsState(true);
    addToast("Accepted all cookies & telemetry", "success");
  };

  const handleRejectNonEssential = () => {
    rejectNonEssential();
    setPrefsState(false);
    setAnalyticsState(false);
    addToast("Non-essential storage & telemetry disabled", "info");
  };

  return (
    <div className="rounded-card border border-line-hair bg-card p-6 shadow-float-1">
      <div className="flex items-center justify-between border-b border-line-soft pb-4 mb-6">
        <div>
          <h3 className="font-serif text-[20px] font-normal text-ink-900 flex items-center gap-2">
            <Sliders size={20} className="text-emerald-600" />
            Cookie &amp; Storage Preferences
          </h3>
          <p className="text-[13px] text-ink-600 mt-0.5">
            Manage how Jorata uses local storage and telemetry on this browser.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Essential Category */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-surface text-green-800">
              <Database size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-[14.5px] font-semibold text-ink-900">
                  Essential Storage &amp; Functionality
                </h4>
                <span className="rounded-full bg-sage-surface px-2.5 py-0.5 text-[11px] font-medium text-green-800">
                  Always Active
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-600 max-w-[55ch]">
                Required for core product operations: saving your mind maps, tasks, goals, notes, theme settings, and offline synchronization. Without this storage, Jorata cannot function.
              </p>
            </div>
          </div>
          <ToggleSwitch checked={true} disabled={true} label="Essential storage (Always active)" />
        </div>

        <div className="h-px bg-line-soft" />

        {/* Preferences Category */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-surface text-green-800">
              <Shield size={16} />
            </div>
            <div>
              <h4 className="text-[14.5px] font-semibold text-ink-900">
                Personalization &amp; Interface Preferences
              </h4>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-600 max-w-[55ch]">
                Remembers optional interface settings such as sidebar collapse preference, Daily Wisdom strip visibility, and recent UI layout states across sessions.
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={prefsState}
            onChange={setPrefsState}
            label="Personalization & Interface Preferences"
          />
        </div>

        <div className="h-px bg-line-soft" />

        {/* Analytics / Telemetry Category */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-surface text-green-800">
              <BarChart2 size={16} />
            </div>
            <div>
              <h4 className="text-[14.5px] font-semibold text-ink-900">
                Product Usage Telemetry
              </h4>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-600 max-w-[55ch]">
                Allows anonymous visitor session pings to help us understand product adoption, general performance, and features used. Never contains task text, notes, or mind map contents.
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={analyticsState}
            onChange={setAnalyticsState}
            label="Product Usage Telemetry"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-5">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleRejectNonEssential}>
            Reject Non-Essential
          </Button>
          <Button variant="secondary" size="sm" onClick={handleAcceptAll}>
            Accept All
          </Button>
        </div>

        <Button variant="primary" size="sm" onClick={handleSave}>
          <Check size={14} />
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  label,
}: {
  checked: boolean;
  onChange?: (val: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        checked ? "bg-emerald-500" : "bg-track",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-card shadow-float-1 transition-all duration-200",
          checked ? "left-[22px]" : "left-0.5"
        )}
      />
    </button>
  );
}

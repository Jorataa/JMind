"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/stores/use-toast-store";
import {
  Mail,
  Phone,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  User,
  Heart,
  ShieldCheck,
  Code2,
} from "lucide-react";

export default function ProfilePage() {
  const addToast = useToast();
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const email = "getjorata@gmail.com";
  const phone = "+62 819-7777-7152";
  const rawPhone = "6281977777152";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    addToast("Email copied to clipboard", "success");
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    addToast("Phone number copied to clipboard", "success");
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <PageHeader
        context="ABOUT THE MAKER"
        title={<>Creator <em>Profile</em></>}
      />

      <div className="mt-6 flex flex-col gap-6">
        {/* Main Profile Hero Card */}
        <div className="relative overflow-hidden rounded-card border border-line-hair bg-card p-6 md:p-8 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              {/* Profile Avatar / Initials Badge */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-ochre-500 text-2xl font-bold text-evergreen-950 shadow-md">
                JT
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-2xl font-semibold text-ink-900">
                    Jovan Tioria
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600">
                    <ShieldCheck size={12} /> Solo Founder & Developer
                  </span>
                </div>
                <p className="text-[13.5px] text-ink-600">
                  Building Jorata — a calm, visual workspace for thinking and execution.
                </p>
                <div className="mt-1 flex items-center gap-2 text-[12px] text-ink-500">
                  <span className="flex items-center gap-1">
                    <Heart size={13} className="text-clay-500" /> Student & Creator
                  </span>
                  <span>•</span>
                  <span>Indonesia</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-line-soft pt-5">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-500">
              Why Jorata?
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-700">
              Jorata was born out of a desire for a quiet, focused room for loud minds.
              Instead of overwhelming dashboards and rigid protocols, Jorata combines mind maps,
              tasks, and progress tracking into one calm workspace where your ideas can grow naturally.
            </p>
          </div>
        </div>

        {/* Direct Contact Options (Granny/Child Rule - High Clarity) */}
        <div>
          <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-500">
            Get in Touch
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Email Card */}
            <div className="flex flex-col justify-between rounded-card border border-line-hair bg-card p-5 transition-all hover:border-line-medium">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sunken text-ink-800">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-ink-500">
                      Email
                    </p>
                    <p className="text-[14px] font-semibold text-ink-900">
                      {email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 pt-2">
                <a
                  href={`mailto:${email}`}
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-evergreen-950 px-3 text-[12.5px] font-medium text-white transition-colors hover:bg-evergreen-900"
                >
                  <Mail size={14} /> Send Email
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-line-hair bg-sunken px-3 text-[12.5px] font-medium text-ink-700 transition-colors hover:bg-paper"
                  title="Copy email address"
                >
                  {copiedEmail ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {copiedEmail ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Phone / WhatsApp Card */}
            <div className="flex flex-col justify-between rounded-card border border-line-hair bg-card p-5 transition-all hover:border-line-medium">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sunken text-ink-800">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-ink-500">
                      Phone / WhatsApp
                    </p>
                    <p className="text-[14px] font-semibold text-ink-900">
                      {phone}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 pt-2">
                <a
                  href={`https://wa.me/${rawPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-[12.5px] font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  <MessageSquare size={14} /> WhatsApp
                </a>
                <a
                  href={`tel:${phone}`}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-line-hair bg-sunken px-3 text-[12.5px] font-medium text-ink-700 transition-colors hover:bg-paper"
                  title="Call phone number"
                >
                  <Phone size={14} /> Call
                </a>
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="flex h-9 items-center justify-center rounded-lg border border-line-hair bg-sunken px-2.5 text-ink-700 transition-colors hover:bg-paper"
                  title="Copy phone number"
                >
                  {copiedPhone ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Local-first Commitment & Tech stack footnote */}
        <div className="rounded-card border border-line-hair bg-sunken p-5">
          <div className="flex items-start gap-3">
            <Code2 size={18} className="mt-0.5 shrink-0 text-ink-500" />
            <div className="flex flex-col gap-1 text-[12.5px] text-ink-600 leading-relaxed">
              <p className="font-semibold text-ink-900">
                Built with care for your clarity
              </p>
              <p>
                Jorata is engineered local-first using Next.js, React Flow, and Zustand. Your data stays in your browser on this device unless you choose to sync to the cloud.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

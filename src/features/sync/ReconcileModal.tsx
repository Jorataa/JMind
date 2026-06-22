"use client";

import { useState } from "react";
import { Laptop, Cloud, GitMerge } from "lucide-react";
import { resolveReconcile } from "@/lib/sync/sync-engine";
import { usePendingReconcile } from "@/stores/use-sync-store";
import type { ReconcileChoice } from "@/lib/sync/types";

/**
 * The one-time first-sign-in choice, shown only when a device already holds
 * local work AND the account already holds synced data. We never silently
 * overwrite either side — the user explicitly decides how to combine them.
 */
export default function ReconcileModal() {
  const pending = usePendingReconcile();
  const [busy, setBusy] = useState<ReconcileChoice | null>(null);

  if (!pending) return null;

  const choose = async (choice: ReconcileChoice) => {
    setBusy(choice);
    try {
      await resolveReconcile(choice);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reconcile-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-900 p-7 shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 id="reconcile-title" className="text-[20px] font-semibold text-zinc-50">
          You already have data here and in the cloud
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">
          This device has work saved locally, and your account has synced data too. How would
          you like to combine them? Nothing is deleted until you choose.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <ChoiceButton
            icon={<GitMerge size={18} />}
            title="Merge both (recommended)"
            description="Keep everything from this device and the cloud together. Non-destructive."
            onClick={() => choose("merge")}
            loading={busy === "merge"}
            disabled={busy !== null}
            highlight
          />
          <ChoiceButton
            icon={<Laptop size={18} />}
            title="Keep this device's data"
            description="Use what's on this device and overwrite the cloud copy."
            onClick={() => choose("keep-local")}
            loading={busy === "keep-local"}
            disabled={busy !== null}
          />
          <ChoiceButton
            icon={<Cloud size={18} />}
            title="Use my synced data"
            description="Pull the cloud copy down, replacing this device's local data."
            onClick={() => choose("use-cloud")}
            loading={busy === "use-cloud"}
            disabled={busy !== null}
          />
        </div>
      </div>
    </div>
  );
}

function ChoiceButton({
  icon,
  title,
  description,
  onClick,
  loading,
  disabled,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-150 disabled:opacity-60",
        highlight
          ? "border-emerald-500/40 bg-emerald-500/[0.06] hover:border-emerald-500/60 hover:bg-emerald-500/10"
          : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]",
      ].join(" ")}
    >
      <span className={highlight ? "mt-0.5 text-emerald-400" : "mt-0.5 text-zinc-400"}>{icon}</span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[14px] font-semibold text-zinc-100">
          {title}
          {loading && <span className="ml-2 text-[12px] font-normal text-zinc-400">working…</span>}
        </span>
        <span className="text-[12px] leading-relaxed text-zinc-500">{description}</span>
      </span>
    </button>
  );
}

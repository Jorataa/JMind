"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import GoalFormModal from "./GoalFormModal";
import { useKPIStore, useKPIActions } from "@/stores/use-kpi-store";
import { useGroves, GROVE_DOT_CLASS } from "@/stores/use-grove-store";
import { useToast } from "@/stores/use-toast-store";
import { useHydrated } from "@/hooks/use-hydrated";
import type { KPI } from "@/types/kpi";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Goals (design handoff §7): metric cards — serif name, big mono
 * current/target, 5-segment progress, quiet sparkline, inline "+ Log
 * progress". The header line is the insight, in Jorata's voice.
 */

function insightLine(kpis: KPI[]): React.ReactNode {
  if (kpis.length === 0)
    return (
      <>
        Track <em>one number</em> that matters.
      </>
    );
  const now = Date.now();
  const moving = kpis.filter((k) => now - new Date(k.updatedAt).getTime() < 7 * 86_400_000);
  const quiet = kpis.filter((k) => now - new Date(k.updatedAt).getTime() >= 7 * 86_400_000);
  const word = (n: number) =>
    ["No", "One", "Two", "Three", "Four", "Five", "Six"][n] ?? String(n);

  if (quiet.length === 0)
    return (
      <>
        {kpis.length === 1 ? "Your goal is" : `All ${kpis.length === 2 ? "both" : kpis.length} goals are`}{" "}
        <em>moving.</em>
      </>
    );
  if (moving.length === 0)
    return (
      <>
        Everything&apos;s gone <em>quiet</em> — log one number to restart.
      </>
    );
  const days = Math.floor(
    (now - new Date(quiet[0].updatedAt).getTime()) / 86_400_000
  );
  return (
    <>
      {word(moving.length)} goal{moving.length === 1 ? " is" : "s are"} moving;{" "}
      <em>
        {quiet.length === 1 ? "one has" : `${quiet.length} have`} been quiet {days} days.
      </em>
    </>
  );
}

export default function GoalsPage() {
  const hydrated = useHydrated();
  const kpis = useKPIStore((state) => state.kpis);
  const [formTarget, setFormTarget] = useState<"new" | KPI | null>(null);

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-12 pt-6 md:px-9 md:pt-8">
      <PageHeader
        size="h1"
        context="Goals"
        title={hydrated ? insightLine(kpis) : <>&nbsp;</>}
        actions={
          <Button onClick={() => setFormTarget("new")}>
            <Plus size={15} />
            New goal
          </Button>
        }
      />

      {!hydrated ? (
        <div className="mt-8 grid gap-[13px] md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton-shimmer h-52 rounded-card" />
          ))}
        </div>
      ) : kpis.length === 0 ? (
        <EmptyState
          className="mt-10"
          title="Track one number that matters."
          description="Words written, clients signed, kilometres run — one honest metric beats ten vanity ones."
          action={
            <Button onClick={() => setFormTarget("new")}>
              <Plus size={15} />
              First goal
            </Button>
          }
        />
      ) : (
        <div className="mt-8 grid gap-[13px] md:grid-cols-2 xl:grid-cols-3">
          {kpis.map((kpi) => (
            <GoalCard key={kpi.id} kpi={kpi} onEdit={() => setFormTarget(kpi)} />
          ))}
        </div>
      )}

      {formTarget && (
        <GoalFormModal
          goal={formTarget === "new" ? undefined : formTarget}
          onClose={() => setFormTarget(null)}
        />
      )}
    </div>
  );
}

function GoalCard({ kpi, onEdit }: { kpi: KPI; onEdit: () => void }) {
  const { updateProgress, removeKPI } = useKPIActions();
  const groves = useGroves();
  const addToast = useToast();
  const [logging, setLogging] = useState(false);
  const [logValue, setLogValue] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const grove = groves.find((g) => g.id === kpi.groveId);
  const pct = Math.min(kpi.value / kpi.target, 1);
  const filled = Math.round(pct * 5);

  const commitLog = () => {
    const parsed = Number(logValue.replace(/[^0-9.-]/g, ""));
    if (!Number.isNaN(parsed) && logValue.trim() !== "") {
      updateProgress(kpi.id, parsed);
      addToast(`${kpi.label}: ${parsed.toLocaleString()} ${kpi.unit}`, "success");
    }
    setLogValue("");
    setLogging(false);
  };

  return (
    <Card className="group gap-4">
      <div className="flex items-start gap-2">
        <h3 className="min-w-0 flex-1 font-serif text-[20px] leading-[1.25] text-ink-900">
          {kpi.label}
        </h3>
        {grove && (
          <span
            className={cn("mt-2 h-[7px] w-[7px] shrink-0 rounded-[3px]", GROVE_DOT_CLASS[grove.color])}
            title={grove.name}
          />
        )}
        <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full p-1.5 text-ink-500 transition-colors hover:bg-sunken hover:text-ink-900"
            aria-label={`Edit ${kpi.label}`}
          >
            <Pencil size={12.5} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!confirmingDelete) {
                setConfirmingDelete(true);
                window.setTimeout(() => setConfirmingDelete(false), 3000);
                return;
              }
              removeKPI(kpi.id);
              addToast("Goal removed", "info");
            }}
            className={cn(
              "flex items-center gap-1 rounded-full p-1.5 transition-colors",
              confirmingDelete
                ? "bg-clay-bg text-clay-text"
                : "text-ink-500 hover:bg-clay-bg hover:text-clay-text"
            )}
            aria-label={confirmingDelete ? `Confirm delete ${kpi.label}` : `Delete ${kpi.label}`}
          >
            {confirmingDelete ? <Check size={12.5} /> : <Trash2 size={12.5} />}
            {confirmingDelete && <span className="text-[10px] font-semibold">Sure?</span>}
          </button>
        </span>
      </div>

      <p className="font-mono text-[22px] leading-none text-ink-900">
        {kpi.value.toLocaleString()}
        <span className="text-ink-400"> / {kpi.target.toLocaleString()}</span>
        <span className="ml-1.5 text-[12px] text-ink-500">{kpi.unit}</span>
      </p>

      {/* 5-segment progress */}
      <div className="flex gap-1" aria-label={`${Math.round(pct * 100)}% of target`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn(
              "h-[5px] flex-1 rounded-full",
              i < filled ? "bg-emerald-500" : "bg-sunken"
            )}
          />
        ))}
      </div>

      <Sparkline history={kpi.history} />

      <div className="mt-auto flex items-center justify-between gap-2">
        {logging ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              autoFocus
              inputMode="decimal"
              value={logValue}
              onChange={(e) => setLogValue(e.target.value)}
              onBlur={commitLog}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitLog();
                if (e.key === "Escape") {
                  setLogValue("");
                  setLogging(false);
                }
              }}
              placeholder={`${kpi.value.toLocaleString()} ${kpi.unit}`}
              className="h-8 w-full rounded-full border border-line-strong bg-card px-3 font-mono text-[12.5px] text-ink-900 placeholder:text-ink-400 focus:border-emerald-500 focus:outline-none"
              aria-label={`New value for ${kpi.label}`}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setLogging(true)}
            className="flex items-center gap-1 text-[12.5px] text-ink-600 transition-colors hover:text-ink-900"
          >
            <Plus size={12} />
            Log progress
          </button>
        )}
        <span className="shrink-0 font-mono text-[10.5px] text-ink-400">
          {Math.round(pct * 100)}%
        </span>
      </div>
    </Card>
  );
}

/** Quiet history line — 1.5px emerald, no fill (§7). */
function Sparkline({ history }: { history: KPI["history"] }) {
  const points = useMemo(() => {
    const values = history.slice(-20).map((h) => h.value);
    if (values.length < 2) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const w = 200;
    const h = 28;
    return values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = h - 3 - ((v - min) / span) * (h - 6);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [history]);

  if (!points) {
    return (
      <p className="font-serif text-[12px] italic text-ink-400">
        The line starts with your second entry.
      </p>
    );
  }

  return (
    <svg viewBox="0 0 200 28" className="h-[28px] w-full" preserveAspectRatio="none" aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-emerald-500)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

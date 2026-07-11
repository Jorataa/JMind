"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useKPIActions } from "@/stores/use-kpi-store";
import { useGroves } from "@/stores/use-grove-store";
import { useToast } from "@/stores/use-toast-store";
import type { KPI } from "@/types/kpi";

/** Create or edit a goal (§6.9 dialog). */
export default function GoalFormModal({
  goal,
  onClose,
}: {
  goal?: KPI;
  onClose: () => void;
}) {
  const { addKPI, editKPI } = useKPIActions();
  const groves = useGroves();
  const addToast = useToast();

  const [label, setLabel] = useState(goal?.label ?? "");
  const [target, setTarget] = useState(goal ? String(goal.target) : "");
  const [current, setCurrent] = useState(goal ? String(goal.value) : "");
  const [unit, setUnit] = useState(goal?.unit ?? "");
  const [groveId, setGroveId] = useState(goal?.groveId ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = Number(target);
    const currentNum = Number(current || 0);
    if (!label.trim() || !unit.trim() || Number.isNaN(targetNum) || targetNum <= 0) return;

    if (goal) {
      editKPI(goal.id, {
        label: label.trim(),
        target: Math.max(targetNum, 1),
        unit: unit.trim(),
        groveId: groveId || undefined,
      });
      addToast("Goal updated", "success");
    } else {
      addKPI(label.trim(), targetNum, unit.trim(), undefined, currentNum, {
        groveId: groveId || undefined,
      });
      addToast("Goal added", "success");
    }
    onClose();
  };

  return (
    <Modal
      title={goal ? "Edit goal" : "New goal"}
      description="One honest number and where it should end up."
      onClose={onClose}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Draft the thesis"
          className="h-11 w-full rounded-inner border border-line-strong bg-card px-4 text-[14.5px] text-ink-900 placeholder:text-ink-400 focus:border-emerald-500 focus:outline-none"
          aria-label="Goal name"
        />
        <div className="grid grid-cols-3 gap-3">
          {!goal && (
            <label className="flex flex-col gap-1.5">
              <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
                Current
              </span>
              <input
                inputMode="decimal"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="0"
                className="h-9 rounded-full border border-line-hair bg-card px-3 font-mono text-[12.5px] text-ink-900 placeholder:text-ink-400 focus:border-emerald-500 focus:outline-none"
              />
            </label>
          )}
          <label className="flex flex-col gap-1.5">
            <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
              Target
            </span>
            <input
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="60000"
              className="h-9 rounded-full border border-line-hair bg-card px-3 font-mono text-[12.5px] text-ink-900 placeholder:text-ink-400 focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
              Unit
            </span>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="words"
              className="h-9 rounded-full border border-line-hair bg-card px-3 text-[12.5px] text-ink-900 placeholder:text-ink-400 focus:border-emerald-500 focus:outline-none"
            />
          </label>
        </div>
        {groves.length > 0 && (
          <label className="flex flex-col gap-1.5">
            <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
              Grove
            </span>
            <select
              value={groveId}
              onChange={(e) => setGroveId(e.target.value)}
              className="h-9 w-full rounded-full border border-line-hair bg-card px-3 text-[12.5px] text-ink-700 focus:outline-none"
            >
              <option value="">None</option>
              {groves.map((grove) => (
                <option key={grove.id} value={grove.id}>
                  {grove.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="mt-1 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!label.trim() || !unit.trim() || !target}
          >
            {goal ? "Save" : "Add goal"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

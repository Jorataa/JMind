"use client";

import { FormEvent, useState } from "react";
import { KPI, useKPIActions } from "@/stores/use-kpi-store";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface KPIFormProps {
  kpi?: KPI; // If provided, we are editing
  onClose: () => void;
}

export default function KPIForm({ kpi, onClose }: KPIFormProps) {
  const { addKPI, editKPI } = useKPIActions();
  const [label, setLabel] = useState(kpi?.label ?? "");
  const [target, setTarget] = useState(kpi?.target?.toString() ?? "");
  const [current, setCurrent] = useState(kpi?.value?.toString() ?? "0");
  const [unit, setUnit] = useState(kpi?.unit ?? "");
  const [category, setCategory] = useState(kpi?.category ?? "");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !target.trim() || !unit.trim()) return;

    const targetVal = parseFloat(target);
    const currentVal = parseFloat(current);

    if (isNaN(targetVal) || targetVal <= 0) return;
    if (isNaN(currentVal) || currentVal < 0) return;

    if (kpi) {
      editKPI(kpi.id, {
        label: label.trim(),
        target: targetVal,
        value: currentVal,
        unit: unit.trim(),
        category: category.trim() || undefined,
      });
    } else {
      addKPI(label.trim(), targetVal, unit.trim(), category.trim() || undefined);
    }
    onClose();
  };

  return (
    <Modal
      title={kpi ? "Edit KPI" : "Create KPI"}
      description={kpi ? "Update your performance indicator." : "Set a new target to track."}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Title"
          autoFocus
          required
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Focus Hours"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Target"
            required
            type="number"
            step="any"
            min="0.01"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="0"
          />
          <Input
            label="Unit"
            required
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="hrs, km, books..."
          />
        </div>

        {kpi && (
          <Input
            label="Current Progress"
            type="number"
            step="any"
            min="0"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        )}

        <Input
          label="Category (Optional)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Study, Health"
        />

        <div className="mt-4 flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {kpi ? "Save Changes" : "Create KPI"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

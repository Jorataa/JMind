"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useTaskActions } from "@/stores/use-task-store";
import { useGroves } from "@/stores/use-grove-store";
import { useToast } from "@/stores/use-toast-store";
import { getLocalDateKey } from "@/lib/format-date";
import type { TaskPriority, TaskEnergy } from "@/types/tasks";
import { cn } from "@/lib/cn";

/**
 * New task (§6.9 dialog): title, priority H/M/L, energy Deep/Quick/Low,
 * optional day and grove — mirroring the node→task popover's grammar (§5.4).
 */
export default function NewTaskModal({ onClose }: { onClose: () => void }) {
  const { addTask } = useTaskActions();
  const groves = useGroves();
  const addToast = useToast();

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [energy, setEnergy] = useState<TaskEnergy>("quick");
  const [due, setDue] = useState<string>("");
  const [groveId, setGroveId] = useState<string>("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const dueDate = due
      ? new Date(
          Number(due.slice(0, 4)),
          Number(due.slice(5, 7)) - 1,
          Number(due.slice(8, 10)),
          12
        ).toISOString()
      : undefined;
    addTask(title.trim(), priority, energy, undefined, undefined, {
      groveId: groveId || undefined,
      dueDate,
    });
    addToast("Task added", "success");
    onClose();
  };

  return (
    <Modal title="New task" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          className="h-11 w-full rounded-inner border border-line-strong bg-card px-4 text-[14.5px] text-ink-900 placeholder:text-ink-400 focus:border-emerald-500 focus:outline-none"
          aria-label="Task title"
        />

        <div className="flex flex-wrap gap-5">
          <fieldset>
            <legend className="mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
              Priority
            </legend>
            <div className="flex gap-1">
              {(["high", "medium", "low"] as const).map((p) => (
                <PillOption
                  key={p}
                  label={p === "high" ? "H" : p === "medium" ? "M" : "L"}
                  title={p}
                  active={priority === p}
                  onClick={() => setPriority(p)}
                />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
              Energy
            </legend>
            <div className="flex gap-1">
              {(["deep", "quick", "low"] as const).map((en) => (
                <PillOption
                  key={en}
                  label={en}
                  active={energy === en}
                  onClick={() => setEnergy(en)}
                />
              ))}
            </div>
          </fieldset>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
              Day (optional)
            </span>
            <input
              type="date"
              value={due}
              min={getLocalDateKey()}
              onChange={(e) => setDue(e.target.value)}
              className="h-9 rounded-full border border-line-hair bg-card px-3 text-[12.5px] text-ink-700 focus:border-emerald-500 focus:outline-none"
            />
          </label>
          {groves.length > 0 && (
            <label className="flex flex-col gap-1.5">
              <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
                Grove
              </span>
              <select
                value={groveId}
                onChange={(e) => setGroveId(e.target.value)}
                className="h-9 rounded-full border border-line-hair bg-card px-3 text-[12.5px] text-ink-700 focus:outline-none"
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
        </div>

        <div className="mt-1 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={!title.trim()}>
            Add task
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function PillOption({
  label,
  title,
  active,
  onClick,
}: {
  label: string;
  title?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        "h-8 min-w-[34px] rounded-full px-2.5 text-[12px] capitalize transition-colors",
        active
          ? "bg-evergreen-900 font-medium text-[#E9EDE0]"
          : "border border-line-hair bg-card text-ink-600 hover:text-ink-900"
      )}
    >
      {label}
    </button>
  );
}

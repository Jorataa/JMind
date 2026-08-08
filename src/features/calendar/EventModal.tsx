"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  useCalendarActions,
  type CalendarEvent,
  type CalendarEventType,
} from "@/stores/use-calendar-store";
import { useToast } from "@/stores/use-toast-store";
import { getLocalDateKey } from "@/lib/format-date";
import { DEFAULT_DURATION_MIN } from "./calendar-time";
import { cn } from "@/lib/cn";
import { Trash2 } from "lucide-react";

/**
 * Event dialog (§6.9 grammar): title, Event/Hold, day, a real start time and
 * duration — or all-day. One dialog for create and edit; delete lives here so
 * the grid stays free of accidental ✕s.
 */

export type EventModalState =
  | { mode: "create"; date: string; start?: string }
  | { mode: "edit"; event: CalendarEvent };

const DURATIONS: { minutes: number; label: string }[] = [
  { minutes: 30, label: "30m" },
  { minutes: 60, label: "1h" },
  { minutes: 90, label: "1.5h" },
  { minutes: 120, label: "2h" },
  { minutes: 180, label: "3h" },
];

export default function EventModal({
  state,
  onClose,
}: {
  state: EventModalState;
  onClose: () => void;
}) {
  const { addEvent, updateEvent, removeEvent } = useCalendarActions();
  const addToast = useToast();

  const editing = state.mode === "edit" ? state.event : null;
  const [title, setTitle] = useState(editing?.title ?? "");
  const [type, setType] = useState<CalendarEventType>(editing?.type ?? "event");
  const [date, setDate] = useState(
    editing?.date ?? (state.mode === "create" ? state.date : getLocalDateKey())
  );
  const initialStart =
    editing?.start ?? (state.mode === "create" ? state.start : undefined);
  const [allDay, setAllDay] = useState(!initialStart);
  const [start, setStart] = useState(initialStart ?? "09:00");
  const [durationMin, setDurationMin] = useState(
    editing?.durationMin ?? DEFAULT_DURATION_MIN
  );
  const [note, setNote] = useState(editing?.note ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    const timing = allDay
      ? { start: undefined, durationMin: undefined }
      : { start, durationMin };
    if (editing) {
      updateEvent(editing.id, { title: title.trim(), type, date, note: note.trim() || undefined, ...timing });
    } else {
      addEvent({ title: title.trim(), type, date, note: note.trim() || undefined, ...timing });
      addToast(type === "hold" ? "Time held" : "Event added", "success");
    }
    onClose();
  };

  const handleDelete = () => {
    if (!editing) return;
    removeEvent(editing.id);
    addToast("Event removed", "info");
    onClose();
  };

  return (
    <Modal title={editing ? "Edit event" : "New event"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's happening?"
          className="h-11 w-full rounded-inner border border-line-strong bg-card px-4 text-[14.5px] text-ink-900 placeholder:text-ink-400 focus:border-emerald-500 focus:outline-none"
          aria-label="Event title"
        />

        <fieldset>
          <legend className="mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
            Kind
          </legend>
          <div className="flex gap-1">
            <TypePill
              label="Event"
              hint="a commitment"
              active={type === "event"}
              onClick={() => setType("event")}
            />
            <TypePill
              label="Hold"
              hint="reserved time"
              active={type === "hold"}
              onClick={() => setType("hold")}
            />
          </div>
        </fieldset>

        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
              Day
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="h-9 rounded-inner border border-line-strong bg-card px-3 font-mono text-[12.5px] text-ink-900 focus:border-emerald-500 focus:outline-none"
            />
          </label>

          {!allDay && (
            <label className="flex flex-col gap-1.5">
              <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
                Starts
              </span>
              <input
                type="time"
                value={start}
                step={300}
                onChange={(e) => setStart(e.target.value)}
                className="h-9 rounded-inner border border-line-strong bg-card px-3 font-mono text-[12.5px] text-ink-900 focus:border-emerald-500 focus:outline-none"
              />
            </label>
          )}

          <button
            type="button"
            onClick={() => setAllDay((v) => !v)}
            aria-pressed={allDay}
            className={cn(
              "h-9 rounded-full border px-3.5 text-[12.5px] transition-colors",
              allDay
                ? "border-evergreen-900 bg-evergreen-900 font-medium text-[#E9EDE0]"
                : "border-line-strong bg-card text-ink-600 hover:text-ink-900"
            )}
          >
            All day
          </button>
        </div>

        {!allDay && (
          <fieldset>
            <legend className="mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
              For
            </legend>
            <div className="flex flex-wrap gap-1">
              {DURATIONS.map((d) => (
                <button
                  key={d.minutes}
                  type="button"
                  onClick={() => setDurationMin(d.minutes)}
                  aria-pressed={durationMin === d.minutes}
                  className={cn(
                    "h-8 rounded-full border px-3 font-mono text-[12px] transition-colors",
                    durationMin === d.minutes
                      ? "border-evergreen-900 bg-evergreen-900 text-[#E9EDE0]"
                      : "border-line-strong bg-card text-ink-600 hover:text-ink-900"
                  )}
                >
                  {d.label}
                </button>
              ))}
              {!DURATIONS.some((d) => d.minutes === durationMin) && (
                <span className="flex h-8 items-center rounded-full border border-evergreen-900 bg-evergreen-900 px-3 font-mono text-[12px] text-[#E9EDE0]">
                  {durationMin}m
                </span>
              )}
            </div>
          </fieldset>
        )}

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          className="h-9 w-full rounded-inner border border-line-strong bg-card px-3.5 text-[13px] text-ink-700 placeholder:text-ink-400 focus:border-emerald-500 focus:outline-none"
          aria-label="Event note"
        />

        <div className="mt-1 flex items-center gap-2">
          {editing && (
            <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 size={13} />
              Delete
            </Button>
          )}
          <span className="flex-1" />
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={!title.trim()}>
            {editing ? "Save changes" : "Add to calendar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function TypePill({
  label,
  hint,
  active,
  onClick,
}: {
  label: string;
  hint: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[12.5px] transition-colors",
        active
          ? "border-evergreen-900 bg-evergreen-900 font-medium text-[#E9EDE0]"
          : "border-line-strong bg-card text-ink-600 hover:text-ink-900"
      )}
    >
      {label}
      <span className={cn("text-[10.5px]", active ? "text-[#E9EDE0]/60" : "text-ink-400")}>
        {hint}
      </span>
    </button>
  );
}

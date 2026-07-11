"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useNotes, useNoteActions, type Note } from "@/stores/use-note-store";
import { useGroves, GROVE_DOT_CLASS } from "@/stores/use-grove-store";
import { useUIActions } from "@/stores/use-ui-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatRelativeTime } from "@/lib/format-date";
import { cn } from "@/lib/cn";
import { ArrowLeft, Plus, Trash2, Sparkles } from "lucide-react";

/**
 * Notes (design handoff §7): left filter list · masonry of note cards ·
 * full-width doc editor. Serif titles, quiet paper cards.
 */
export default function NotesPage() {
  const hydrated = useHydrated();
  const notes = useNotes();
  const groves = useGroves();
  const { addNote, updateNote, removeNote } = useNoteActions();

  const [filter, setFilter] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const openNote = notes.find((n) => n.id === openId) ?? null;

  const filtered = useMemo(
    () => (filter === "all" ? notes : notes.filter((n) => n.groveId === filter)),
    [notes, filter]
  );

  const handleNew = () => {
    const note = addNote(filter !== "all" ? { groveId: filter } : undefined);
    setOpenId(note.id);
  };

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-12 pt-6 md:px-9 md:pt-8">
      {openNote ? (
        <NoteEditor
          key={openNote.id}
          note={openNote}
          groves={groves}
          onBack={() => setOpenId(null)}
          onChange={(updates) => updateNote(openNote.id, updates)}
          onDelete={() => {
            removeNote(openNote.id);
            setOpenId(null);
          }}
        />
      ) : (
        <>
          <PageHeader
            size="h1"
            context="Notes"
            title={
              <>
                Written down, <em>off your mind.</em>
              </>
            }
            actions={
              <Button onClick={handleNew}>
                <Plus size={15} />
                New note
              </Button>
            }
          />

          <div className="mt-8 flex gap-8">
            {/* Filter list */}
            <aside className="hidden w-[200px] shrink-0 md:block" aria-label="Note filters">
              <ul className="flex flex-col gap-[2px]">
                <FilterRow
                  label="All notes"
                  count={hydrated ? notes.length : undefined}
                  active={filter === "all"}
                  onClick={() => setFilter("all")}
                />
                {hydrated &&
                  groves.map((grove) => (
                    <FilterRow
                      key={grove.id}
                      label={grove.name}
                      dotClass={GROVE_DOT_CLASS[grove.color]}
                      count={notes.filter((n) => n.groveId === grove.id).length}
                      active={filter === grove.id}
                      onClick={() => setFilter(grove.id)}
                    />
                  ))}
              </ul>
            </aside>

            {/* Masonry */}
            <div className="min-w-0 flex-1">
              {!hydrated ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="skeleton-shimmer h-36 rounded-card" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  title="Nothing written yet."
                  description="Notes catch what the canvas can't hold — drafts, working claims, loose fragments."
                  action={
                    <Button onClick={handleNew}>
                      <Plus size={15} />
                      Write the first one
                    </Button>
                  }
                />
              ) : (
                <div className="columns-1 gap-4 md:columns-2 [&>*]:mb-4">
                  {filtered.map((note) => {
                    const grove = groves.find((g) => g.id === note.groveId);
                    return (
                      <button
                        key={note.id}
                        type="button"
                        onClick={() => setOpenId(note.id)}
                        className="block w-full break-inside-avoid rounded-card border border-line-hair bg-card p-5 text-left transition-all duration-120 hover:border-[#CFC9B8] hover:shadow-float-1"
                      >
                        <h3 className="font-serif text-[18px] leading-snug text-ink-900">
                          {note.title || "Untitled"}
                        </h3>
                        {note.body && (
                          <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-ink-600">
                            {note.body}
                          </p>
                        )}
                        <div className="mt-3.5 flex items-center gap-2 text-[11.5px] text-ink-500">
                          {grove && (
                            <span className="flex items-center gap-1.5">
                              <span
                                className={cn(
                                  "h-[7px] w-[7px] rounded-[3px]",
                                  GROVE_DOT_CLASS[grove.color]
                                )}
                              />
                              {grove.name}
                            </span>
                          )}
                          <span className={grove ? "text-ink-400" : undefined}>
                            {grove ? "·" : ""} edited {formatRelativeTime(note.updatedAt)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FilterRow({
  label,
  count,
  active,
  onClick,
  dotClass,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  dotClass?: string;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-[13px] transition-colors",
          active
            ? "bg-sunken font-medium text-ink-900"
            : "text-ink-600 hover:bg-sunken/60 hover:text-ink-900"
        )}
      >
        {dotClass && <span className={cn("h-[7px] w-[7px] rounded-[3px]", dotClass)} />}
        <span className="flex-1 truncate text-left">{label}</span>
        {typeof count === "number" && (
          <span className="font-mono text-[11px] text-ink-400">{count}</span>
        )}
      </button>
    </li>
  );
}

/** Full-width doc editor: serif title 34, body 16/1.75 (§7 Notes). */
function NoteEditor({
  note,
  groves,
  onBack,
  onChange,
  onDelete,
}: {
  note: Note;
  groves: ReturnType<typeof useGroves>;
  onBack: () => void;
  onChange: (updates: Partial<Pick<Note, "title" | "body" | "groveId">>) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [confirming, setConfirming] = useState(false);
  const [selection, setSelection] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const { openAssistant } = useUIActions();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // AI verbs on text selection (§7): the selected passage goes to the
  // Assistant with the chosen instruction.
  const readSelection = () => {
    const el = bodyRef.current;
    if (!el) return;
    const text = el.value.slice(el.selectionStart, el.selectionEnd).trim();
    setSelection(text.length >= 12 ? text : "");
  };

  const runVerb = (verb: "Summarize" | "Simplify" | "Expand") => {
    const excerpt = selection.length > 1200 ? `${selection.slice(0, 1199)}…` : selection;
    openAssistant(`${verb} this passage from my note "${title || "Untitled"}":\n\n${excerpt}`);
    setSelection("");
  };

  // Debounced autosave — the store write also feeds cross-tab sync.
  const queueSave = (updates: Partial<Pick<Note, "title" | "body">>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onChange(updates), 600);
  };

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    []
  );

  const flushAndBack = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    onChange({ title, body });
    onBack();
  };

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={flushAndBack}>
          <ArrowLeft size={14} />
          All notes
        </Button>
        <div className="flex items-center gap-2">
          <select
            value={note.groveId ?? ""}
            onChange={(e) => onChange({ groveId: e.target.value || undefined })}
            className="h-8 rounded-full border border-line-hair bg-card px-3 text-[12px] text-ink-600 focus:outline-none"
            aria-label="Grove"
          >
            <option value="">No grove</option>
            {groves.map((grove) => (
              <option key={grove.id} value={grove.id}>
                {grove.name}
              </option>
            ))}
          </select>
          <Button
            variant="danger"
            size="sm"
            onClick={() => (confirming ? onDelete() : setConfirming(true))}
            onBlur={() => setConfirming(false)}
          >
            <Trash2 size={13} />
            {confirming ? "Sure?" : "Delete"}
          </Button>
        </div>
      </div>

      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          queueSave({ title: e.target.value, body });
        }}
        placeholder="Untitled"
        className="mt-6 w-full bg-transparent font-serif text-[34px] leading-[1.1] text-ink-900 placeholder:text-ink-400 focus:outline-none"
        aria-label="Note title"
        autoFocus={!note.title}
      />
      <div className="mt-1.5 flex min-h-[28px] items-center gap-3">
        <p className="text-[11.5px] text-ink-500">
          edited {formatRelativeTime(note.updatedAt)}
        </p>
        {selection && (
          <span className="flex items-center gap-1 rounded-full border border-sage-border bg-sage-surface py-0.5 pl-2 pr-1">
            <Sparkles size={10.5} className="text-emerald-600" />
            {(["Summarize", "Simplify", "Expand"] as const).map((verb) => (
              <button
                key={verb}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => runVerb(verb)}
                className="rounded-full px-2 py-0.5 text-[11.5px] text-green-800 transition-colors hover:bg-card"
              >
                {verb}
              </button>
            ))}
          </span>
        )}
      </div>
      <textarea
        ref={bodyRef}
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          queueSave({ title, body: e.target.value });
        }}
        onSelect={readSelection}
        onBlur={() => window.setTimeout(() => setSelection(""), 200)}
        placeholder="Start writing…"
        className="mt-4 min-h-[55vh] w-full resize-none bg-transparent text-[16px] leading-[1.75] text-ink-700 placeholder:text-ink-400 focus:outline-none"
        aria-label="Note body"
      />
    </div>
  );
}

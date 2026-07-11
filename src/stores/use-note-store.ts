import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Notes (design handoff §7, §12) — quiet documents, local-first like
 * everything else. New store, new key: never touches existing data.
 */
export interface Note {
  id: string;
  title: string;
  body: string;
  groveId?: string;
  createdAt: string;
  updatedAt: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sanitizeDate = (value: unknown, fallback: string) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : fallback;

const sanitizeNote = (value: unknown): Note | null => {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || !value.id) return null;

  const now = new Date().toISOString();
  return {
    id: value.id,
    title: typeof value.title === "string" ? value.title : "",
    body: typeof value.body === "string" ? value.body : "",
    groveId:
      typeof value.groveId === "string" && value.groveId ? value.groveId : undefined,
    createdAt: sanitizeDate(value.createdAt, now),
    updatedAt: sanitizeDate(value.updatedAt, now),
  };
};

const sanitizeNotes = (notes: unknown): Note[] => {
  const seen = new Set<string>();
  return (Array.isArray(notes) ? notes : [])
    .map(sanitizeNote)
    .filter((note): note is Note => note !== null)
    .filter((note) => {
      if (seen.has(note.id)) return false;
      seen.add(note.id);
      return true;
    });
};

interface NoteState {
  notes: Note[];
  actions: {
    addNote: (partial?: Partial<Pick<Note, "title" | "body" | "groveId">>) => Note;
    updateNote: (
      id: string,
      updates: Partial<Pick<Note, "title" | "body" | "groveId">>
    ) => void;
    removeNote: (id: string) => void;
  };
}

export const useNoteStore = create<NoteState>()(
  persist(
    (set) => ({
      notes: [],
      actions: {
        addNote: (partial) => {
          const now = new Date().toISOString();
          const note: Note = {
            id: crypto.randomUUID(),
            title: partial?.title ?? "",
            body: partial?.body ?? "",
            groveId: partial?.groveId,
            createdAt: now,
            updatedAt: now,
          };
          set((state) => ({ notes: [note, ...state.notes] }));
          return note;
        },
        updateNote: (id, updates) =>
          set((state) => ({
            notes: state.notes.map((note) =>
              note.id === id
                ? { ...note, ...updates, updatedAt: new Date().toISOString() }
                : note
            ),
          })),
        removeNote: (id) =>
          set((state) => ({ notes: state.notes.filter((note) => note.id !== id) })),
      },
    }),
    {
      name: "jmind:notes",
      partialize: (state) => ({ notes: sanitizeNotes(state.notes) }),
      merge: (persisted, current) => ({
        ...current,
        notes: sanitizeNotes((persisted as Partial<NoteState>)?.notes),
        actions: current.actions,
      }),
    }
  )
);

export const useNotes = () => useNoteStore((state) => state.notes);
export const useNoteActions = () => useNoteStore((state) => state.actions);

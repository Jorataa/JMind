"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useInbox, useInboxActions } from "@/stores/use-inbox-store";
import { useTaskActions } from "@/stores/use-task-store";
import { useNoteActions } from "@/stores/use-note-store";
import { useMindMapStore, ROOT_NODE_ID } from "@/stores/use-mindmap-store";
import { useToast } from "@/stores/use-toast-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatRelativeTime } from "@/lib/format-date";
import { FileText, CheckSquare, Archive, Waypoints } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Inbox (design handoff §7): captured scraps waiting for triage — each becomes
 * a note, a task, a map node, or is archived. Keyboard-first: ↑↓ move,
 * N note · T task · M map · E archive.
 */
export default function InboxPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const items = useInbox();
  const { removeItem } = useInboxActions();
  const { addTask } = useTaskActions();
  const { addNote } = useNoteActions();
  const addNode = useMindMapStore((state) => state.actions.addNode);
  const activeMapTitle = useMindMapStore(
    (state) => state.maps[state.activeMapId]?.title ?? "the active map"
  );
  const addToast = useToast();
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const safeCursor = items.length > 0 ? Math.min(cursor, items.length - 1) : 0;

  const toTask = (id: string, content: string) => {
    addTask(content, "medium", "quick");
    removeItem(id);
    addToast("Now a task", "success");
  };

  const toNote = (id: string, content: string) => {
    addNote({ body: content });
    removeItem(id);
    addToast("Now a note", "success");
  };

  const toMapNode = (id: string, content: string) => {
    addNode(content.length > 80 ? `${content.slice(0, 79)}…` : content, ROOT_NODE_ID);
    removeItem(id);
    addToast(`Placed on ${activeMapTitle}`, "success", {
      label: "open",
      onAction: () => router.push("/mindmap"),
    });
  };

  const archive = (id: string) => {
    removeItem(id);
    addToast("Archived", "info");
  };

  // Keyboard-first triage. Capture phase + stopImmediatePropagation so the
  // global "N = new thought" shortcut yields to "N = note" here.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable || target.closest("input, textarea, select"))
      )
        return;
      if (items.length === 0) return;

      const item = items[Math.min(cursor, items.length - 1)];
      const key = e.key.toLowerCase();
      const act = (fn: () => void) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        fn();
      };

      if (key === "arrowdown" || key === "j") {
        act(() => setCursor((c) => Math.min(c + 1, items.length - 1)));
      } else if (key === "arrowup" || key === "k") {
        act(() => setCursor((c) => Math.max(c - 1, 0)));
      } else if (key === "t" && item) {
        act(() => toTask(item.id, item.content));
      } else if (key === "n" && item) {
        act(() => toNote(item.id, item.content));
      } else if (key === "m" && item) {
        act(() => toMapNode(item.id, item.content));
      } else if (key === "e" && item) {
        act(() => archive(item.id));
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, cursor]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-row="${safeCursor}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [safeCursor]);

  return (
    <div className="mx-auto max-w-[760px] px-5 pb-12 pt-6 md:px-9 md:pt-8">
      <PageHeader
        size="h1"
        context={hydrated && items.length > 0 ? `Inbox — ${items.length} captured` : "Inbox"}
        title={
          <>
            Scraps, <em>waiting to be sorted.</em>
          </>
        }
      />

      {hydrated && items.length > 0 && (
        <p className="mt-4 font-mono text-[10.5px] text-ink-500">
          ↑↓ move · N note · T task · M map · E archive
        </p>
      )}

      {!hydrated ? (
        <div className="mt-6 flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton-shimmer h-16 rounded-inner" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="Inbox zero."
          description="Capture anything with ⌘J or the New thought button — it lands here until you sort it."
        />
      ) : (
        <ul ref={listRef} className="mt-4 flex flex-col gap-2">
          {items.map((item, index) => (
            <li
              key={item.id}
              data-row={index}
              onClick={() => setCursor(index)}
              className={cn(
                "group rounded-inner border bg-card px-5 py-4 transition-colors",
                index === safeCursor
                  ? "border-green-800 shadow-float-1"
                  : "border-line-hair hover:border-[#CFC9B8]"
              )}
            >
              <p className="text-[14px] leading-relaxed text-ink-700">{item.content}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-ink-400">
                  {formatRelativeTime(item.createdAt)}
                </span>
                <span className="flex-1" />
                <TriageButton
                  icon={<FileText size={12} />}
                  label="Note"
                  kbd="N"
                  onClick={() => toNote(item.id, item.content)}
                />
                <TriageButton
                  icon={<CheckSquare size={12} />}
                  label="Task"
                  kbd="T"
                  onClick={() => toTask(item.id, item.content)}
                />
                <TriageButton
                  icon={<Waypoints size={12} />}
                  label="Map"
                  kbd="M"
                  onClick={() => toMapNode(item.id, item.content)}
                />
                <button
                  type="button"
                  onClick={() => archive(item.id)}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] text-ink-500 transition-colors hover:text-ink-900"
                >
                  <Archive size={12} />
                  Archive
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TriageButton({
  icon,
  label,
  kbd,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  kbd: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full border border-line-hair px-3 py-1 text-[12px] text-green-800 transition-colors hover:border-green-800"
    >
      {icon}
      {label}
      <span className="font-mono text-[9.5px] text-ink-400">{kbd}</span>
    </button>
  );
}

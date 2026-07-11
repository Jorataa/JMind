"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PencilLine, X, CornerDownLeft } from "lucide-react";
import { useInboxActions } from "@/stores/use-inbox-store";
import { useUIActions, useUIStore } from "@/stores/use-ui-store";
import { useTaskActions } from "@/stores/use-task-store";
import { useNoteActions } from "@/stores/use-note-store";
import { useMindMapStore } from "@/stores/use-mindmap-store";
import { useToast } from "@/stores/use-toast-store";
import { cn } from "@/lib/cn";

/**
 * Capture (§5.5): ⌘J (or N) opens this centered bar anywhere. ⏎ saves to the
 * Inbox as a scrap unless a chip was chosen — Note, Map, Task, or Ask AI.
 */

type CaptureChip = "note" | "map" | "task" | "ask";

const CHIPS: { id: CaptureChip; label: string }[] = [
  { id: "note", label: "Note" },
  { id: "map", label: "Map" },
  { id: "task", label: "Task" },
  { id: "ask", label: "Ask AI" },
];

export default function QuickCaptureOverlay() {
  const isOpen = useUIStore((state) => state.quickCaptureOpen);
  const { setQuickCaptureOpen, toggleQuickCapture, openAssistant } = useUIActions();
  const { capture } = useInboxActions();
  const { addTask } = useTaskActions();
  const { addNote } = useNoteActions();
  const createMap = useMindMapStore((state) => state.actions.createMap);
  const router = useRouter();
  const [input, setInput] = useState("");
  const [chip, setChip] = useState<CaptureChip | null>(null);
  const addToast = useToast();

  const close = useCallback(() => {
    setQuickCaptureOpen(false);
    setInput("");
    setChip(null);
  }, [setQuickCaptureOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD + J for Quick Capture
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        toggleQuickCapture();
      }
      // Plain N = "New thought" (rail button, §6.1) — never while typing.
      if (
        (e.key === "n" || e.key === "N") &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !isOpen
      ) {
        const target = e.target instanceof Element ? e.target : null;
        const typing =
          target &&
          ((target as HTMLElement).isContentEditable ||
            target.closest("input, textarea, select, [contenteditable]"));
        // On the canvas, N belongs to the node tool (§6.6) — the capture
        // shortcut yields there.
        const onCanvas = target?.closest(".react-flow");
        if (!typing && !onCanvas) {
          e.preventDefault();
          setQuickCaptureOpen(true);
        }
      }
      if (e.key === "Escape" && isOpen) {
        close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [close, isOpen, setQuickCaptureOpen, toggleQuickCapture]);

  const handleCapture = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;

    if (chip === "note") {
      addNote({ body: text });
      addToast("Saved to Notes", "success");
    } else if (chip === "task") {
      addTask(text, "medium", "quick");
      addToast("Task added", "success");
    } else if (chip === "map") {
      createMap(text.length > 60 ? `${text.slice(0, 59)}…` : text);
      close();
      router.push("/mindmap");
      return;
    } else if (chip === "ask") {
      close();
      openAssistant(text);
      return;
    } else {
      capture(text);
      addToast("Captured to Inbox", "success");
    }
    close();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[130] bg-[rgba(27,41,31,0.32)] backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Capture a thought"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="fixed left-1/2 top-[30vh] z-[140] w-full max-w-lg -translate-x-1/2 rounded-[16px] border border-line-hair bg-card p-3 shadow-float-2"
          >
            <form onSubmit={handleCapture}>
              <div className="flex items-center gap-3 rounded-inner border border-line-strong bg-card px-3.5 py-3 transition-colors focus-within:border-emerald-500">
                <PencilLine size={15} className="shrink-0 text-ink-400" />
                <input
                  autoFocus
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={chip === "ask" ? "Ask Jorata anything…" : "What's on your mind?"}
                  className="flex-1 bg-transparent text-[15.5px] text-ink-900 outline-none placeholder:text-ink-400"
                />
                <button
                  type="button"
                  onClick={close}
                  className="shrink-0 rounded-full p-1 text-ink-400 transition-colors hover:text-ink-900"
                  aria-label="Close capture"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="mt-2.5 flex items-center gap-1.5 px-0.5">
                {CHIPS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChip(chip === c.id ? null : c.id)}
                    aria-pressed={chip === c.id}
                    className={cn(
                      "rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
                      chip === c.id
                        ? "bg-sage-surface text-green-800"
                        : "border border-line-hair text-ink-600 hover:text-ink-900"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
                <span className="ml-auto flex items-center gap-1 font-mono text-[10.5px] text-ink-400">
                  <CornerDownLeft size={10.5} />
                  {chip ? CHIPS.find((c) => c.id === chip)?.label : "Inbox"}
                </span>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

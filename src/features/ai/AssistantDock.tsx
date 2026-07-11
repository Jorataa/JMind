"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, RefreshCw, Loader2, StickyNote } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAiChat, type AiChatMessage } from "./useAiChat";
import { useUIStore, useUIActions } from "@/stores/use-ui-store";
import { useMindMapStore, ROOT_NODE_ID } from "@/stores/use-mindmap-store";
import { useShallow } from "zustand/shallow";
import { useTaskStore } from "@/stores/use-task-store";
import { useKPIStore } from "@/stores/use-kpi-store";
import { useInbox } from "@/stores/use-inbox-store";
import { useFocusStore } from "@/stores/use-focus-store";
import { useToast } from "@/stores/use-toast-store";
import { deriveNoticings } from "@/lib/dashboard-insights";
import Link from "next/link";

/**
 * The Assistant (design handoff §7): not a page — a 380px right dock summoned
 * by J or any "Ask" button. Context chip up top, sage AI cards with a serif
 * first line, ambient noticings, and a composer. AI replies can be placed on
 * the canvas as sticky notes.
 */

const PAGE_CONTEXT: Record<string, string> = {
  "/dashboard": "your dashboard",
  "/tasks": "your tasks",
  "/notes": "your notes",
  "/knowledge": "your sources",
  "/calendar": "your week",
  "/kpi": "your goals",
  "/inbox": "your inbox",
};

export default function AssistantDock() {
  const open = useUIStore((state) => state.assistantOpen);
  const seed = useUIStore((state) => state.assistantSeed);
  const { closeAssistant, clearAssistantSeed } = useUIActions();
  const pathname = usePathname();
  const addToast = useToast();

  const { messages, isLoading, error, sendMessage, updateWithMindMap } = useAiChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeMapTitle = useMindMapStore((state) => state.maps[state.activeMapId]?.title);
  // Select the stable nodes array; derive titles in a memo — building the
  // array inside the selector would defeat getSnapshot caching.
  const mapNodes = useMindMapStore((state) => state.nodes);
  const nodeTitles = useMemo(
    () =>
      mapNodes
        .filter((n) => !n.data.isRoot && n.type !== "sticky")
        .map((n) => n.data.label.trim())
        .filter(Boolean),
    [mapNodes]
  );
  const addNode = useMindMapStore((state) => state.actions.addNode);

  // Ambient noticings (§5.3) — the same source as the Dashboard cell.
  const tasks = useTaskStore((state) => state.tasks);
  const kpis = useKPIStore((state) => state.kpis);
  const inboxCount = useInbox().length;
  const focus = useFocusStore(
    useShallow((state) => ({
      activeTaskId: state.activeTaskId,
      deepWorkMode: state.deepWorkMode,
    }))
  );
  const activeMapMeta = useMindMapStore(
    useShallow((state) => {
      const map = state.maps[state.activeMapId];
      return map ? { title: map.title, updatedAt: map.updatedAt } : undefined;
    })
  );

  const noticings = useMemo(() => {
    let dismissed: string[] = [];
    try {
      dismissed = JSON.parse(sessionStorage.getItem("jorata:noticed-later") ?? "[]");
    } catch {
      /* fresh session */
    }
    return deriveNoticings({
      tasks,
      inboxCount,
      activeMap: activeMapMeta,
      kpis,
      focus,
    })
      .filter((n) => !dismissed.includes(n.id))
      .slice(0, 2);
  }, [tasks, inboxCount, activeMapMeta, kpis, focus]);

  const onWorkspace = pathname.startsWith("/mindmap");
  const seeing = onWorkspace
    ? activeMapTitle
      ? `${activeMapTitle} map`
      : "the Workspace"
    : (PAGE_CONTEXT[Object.keys(PAGE_CONTEXT).find((p) => pathname.startsWith(p)) ?? ""] ??
      "Jorata");

  // Global J summons the dock (typing- and canvas-guarded; the canvas binds
  // its own J so the shortcut works there too).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== "j" && e.key !== "J") || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target instanceof Element ? e.target : null;
      if (
        target &&
        ((target as HTMLElement).isContentEditable ||
          target.closest("input, textarea, select, .react-flow"))
      )
        return;
      e.preventDefault();
      useUIStore.getState().actions.openAssistant();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Esc closes; a handed-in question (capture "Ask AI", ⌘⏎) sends itself.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAssistant();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeAssistant]);

  useEffect(() => {
    if (open && seed) {
      sendMessage(seed);
      clearAssistantSeed();
    }
  }, [open, seed, sendMessage, clearAssistantSeed]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = () => {
    sendMessage(input);
    setInput("");
  };

  const placeOnCanvas = (text: string) => {
    const label = text.length > 220 ? `${text.slice(0, 219)}…` : text;
    addNode(label, undefined, undefined, "sticky");
    addToast(`Pinned to ${activeMapTitle ?? "the canvas"}`, "success");
  };

  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.24, ease: [0.2, 0, 0, 1] }}
          role="complementary"
          aria-label="Jorata Assistant"
          className="fixed inset-y-0 right-0 z-[100] flex w-full max-w-[380px] flex-col border-l border-line-hair bg-card shadow-float-3"
        >
          {/* Header: presence + context chip */}
          <div className="flex items-center gap-2.5 border-b border-line-soft px-5 py-3.5">
            <span className="ai-pulse h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
              Assistant
            </span>
            <span className="min-w-0 truncate rounded-full bg-sunken px-2.5 py-0.5 text-[11px] text-ink-600">
              Seeing: {seeing}
            </span>
            <span className="flex-1" />
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-sunken hover:text-ink-900"
              onClick={closeAssistant}
              aria-label="Close assistant"
            >
              <X size={15} />
            </button>
          </div>

          {/* Conversation */}
          <div ref={scrollRef} className="custom-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {/* Ambient noticings lead the panel when nothing is asked yet. */}
            {isEmpty && noticings.length > 0 && (
              <div className="flex flex-col gap-2">
                {noticings.map((noticing) => (
                  <div key={noticing.id} className="rounded-inner bg-sage-surface p-3.5">
                    <p className="font-serif text-[14.5px] leading-[1.42] text-ink-900">
                      {noticing.pre}
                      {noticing.em && (
                        <em className="italic text-green-800">{noticing.em}</em>
                      )}
                      {noticing.post}
                    </p>
                    {"href" in noticing.action && (
                      <Link
                        href={noticing.action.href}
                        onClick={closeAssistant}
                        className="mt-2 inline-block rounded-full bg-evergreen-900 px-3 py-1 text-[11.5px] font-medium text-[#E9EDE0] transition-colors hover:bg-evergreen-deep"
                      >
                        {noticing.action.label}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isEmpty && (
              <div className="flex flex-col items-start gap-1.5 px-1 pt-2">
                <p className="font-serif text-[18px] leading-snug text-ink-900">
                  Think out loud — I&apos;m listening.
                </p>
                <p className="text-[12.5px] leading-relaxed text-ink-600">
                  Plan a project, question an idea, or pull the latest info on your map.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <DockMessage
                key={message.id}
                message={message}
                onPlace={onWorkspace ? () => placeOnCanvas(message.text) : undefined}
              />
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 px-1 text-[12px] text-ink-500">
                <Loader2 size={13} className="animate-spin" />
                Thinking…
              </div>
            )}

            {error && (
              <div className="rounded-node border border-clay-border bg-clay-bg px-3.5 py-2.5 text-[12.5px] text-clay-text">
                Jorata lost the thread — {error}{" "}
                <button
                  type="button"
                  onClick={() => {
                    const lastUser = [...messages].reverse().find((m) => m.role === "user");
                    if (lastUser) sendMessage(lastUser.text);
                  }}
                  className="font-medium underline"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-line-soft px-4 py-3.5">
            {onWorkspace && nodeTitles.length > 0 && (
              <button
                type="button"
                onClick={() => updateWithMindMap(nodeTitles)}
                disabled={isLoading}
                className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-full border border-sage-border bg-sage-surface px-3 py-2 text-[12px] font-medium text-green-800 transition-colors hover:border-sage-500 disabled:pointer-events-none disabled:opacity-40"
              >
                <RefreshCw size={12.5} />
                Update with latest info on this map
              </button>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask anything…"
                rows={1}
                className="max-h-32 min-h-[42px] flex-1 resize-none rounded-[14px] border border-line-strong bg-card px-3.5 py-2.5 text-[13.5px] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-emerald-500"
                aria-label="Message the assistant"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={isLoading || input.trim().length === 0}
                aria-label="Send message"
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white transition-colors hover:bg-emerald-600 disabled:pointer-events-none disabled:opacity-40"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/** User rows plain; AI rows sage cards with a serif lead line (§7). */
function DockMessage({
  message,
  onPlace,
}: {
  message: AiChatMessage;
  onPlace?: () => void;
}) {
  const isUser = message.role === "user";
  if (isUser) {
    return (
      <div className="flex w-full justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-[14px] border border-line-hair bg-paper px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-700">
          {message.text}
        </div>
      </div>
    );
  }

  // Serif lead: the first line (or first ~120 chars) carries the voice.
  const newline = message.text.indexOf("\n");
  const cut = newline > 0 && newline < 160 ? newline : -1;
  const lead = cut > 0 ? message.text.slice(0, cut) : message.text;
  const rest = cut > 0 ? message.text.slice(cut + 1).trim() : "";

  return (
    <div className="group flex w-full justify-start">
      <div className="max-w-[92%] rounded-[14px] bg-sage-surface px-4 py-3">
        <p className="whitespace-pre-wrap font-serif text-[15px] leading-[1.45] text-ink-900">
          {lead}
        </p>
        {rest && (
          <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-700">
            {rest}
          </p>
        )}
        {onPlace && (
          <button
            type="button"
            onClick={onPlace}
            className="mt-2.5 flex items-center gap-1.5 rounded-full border border-sage-500 px-2.5 py-1 text-[11.5px] text-green-800 opacity-0 transition-opacity hover:border-green-800 focus-visible:opacity-100 group-hover:opacity-100"
          >
            <StickyNote size={11.5} />
            Place on canvas
          </button>
        )}
      </div>
    </div>
  );
}

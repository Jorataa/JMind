"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { X, Send, Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import AiMessage from "./AiMessage";
import { useAiChat } from "./useAiChat";

const panelTransition: Transition = { type: "spring", stiffness: 300, damping: 30 };

interface AiChatProps {
  /** Titles of the nodes in the current mind map, for "Update with Latest Info". */
  mindMapNodes: string[];
  open: boolean;
  onClose: () => void;
}

export default function AiChat({ mindMapNodes, open, onClose }: AiChatProps) {
  const { messages, isLoading, error, sendMessage, updateWithMindMap } = useAiChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = () => {
    sendMessage(input);
    setInput("");
  };

  const hasNodes = mindMapNodes.some((title) => title.trim().length > 0);
  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={panelTransition}
          className="absolute inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col border-l border-white/10 bg-zinc-950/85 shadow-2xl backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-emerald-400" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                Jorata AI
              </span>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4 custom-scrollbar">
            {isEmpty && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <Sparkles size={22} className="text-zinc-600" />
                <p className="text-[13px] font-medium text-zinc-400">Ask me anything</p>
                <p className="max-w-[220px] text-[12px] text-zinc-600">
                  Think out loud, plan a project, or pull the latest info on your map.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <AiMessage key={message.id} message={message} />
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 px-1 text-[12px] text-zinc-500">
                <Loader2 size={13} className="animate-spin" />
                Thinking…
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2.5 text-[12px] text-rose-300">
                {error}
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-white/10 px-5 py-4">
            <button
              type="button"
              onClick={() => updateWithMindMap(mindMapNodes)}
              disabled={isLoading || !hasNodes}
              title={hasNodes ? undefined : "Add some nodes to your map first"}
              className={cn(
                "mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/30",
                "bg-emerald-500/10 px-3 py-2 text-[12px] font-semibold text-emerald-300 transition-colors",
                "hover:bg-emerald-500/20 disabled:pointer-events-none disabled:opacity-40"
              )}
            >
              <RefreshCw size={13} />
              Update with Latest Info
            </button>

            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  // Enter sends; Shift+Enter makes a newline.
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message Jorata AI…"
                rows={1}
                className="max-h-32 min-h-[40px] flex-1 resize-none rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[13px] text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-emerald-500/30"
              />
              <Button
                size="sm"
                className="h-10 w-10 shrink-0 p-0"
                onClick={handleSend}
                disabled={isLoading || input.trim().length === 0}
                aria-label="Send message"
              >
                <Send size={15} />
              </Button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

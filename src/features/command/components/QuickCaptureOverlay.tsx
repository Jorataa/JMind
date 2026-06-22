"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, X } from "lucide-react";
import { useInboxActions } from "@/stores/use-inbox-store";
import { useUIActions, useUIStore } from "@/stores/use-ui-store";
import { useToast } from "@/stores/use-toast-store";

export default function QuickCaptureOverlay() {
  const isOpen = useUIStore((state) => state.quickCaptureOpen);
  const { setQuickCaptureOpen, toggleQuickCapture } = useUIActions();
  const { capture } = useInboxActions();
  const [input, setInput] = useState("");
  const addToast = useToast();

  const close = useCallback(() => {
    setQuickCaptureOpen(false);
    setInput("");
  }, [setQuickCaptureOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD + J for Quick Capture
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        toggleQuickCapture();
      }
      if (e.key === "Escape" && isOpen) {
        close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [close, isOpen, toggleQuickCapture]);

  const handleCapture = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    capture(input.trim());
    addToast("Captured to Inbox", "success");
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
            className="fixed inset-0 z-[130] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Quick capture"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 z-[140] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/90 p-2 shadow-2xl shadow-black/50 backdrop-blur-2xl"
          >
            <form onSubmit={handleCapture} className="flex items-center gap-3 p-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Inbox size={20} />
              </div>
              <input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Quick thought..."
                className="flex-1 bg-transparent text-[16px] font-medium text-zinc-100 outline-none placeholder:text-zinc-600"
              />
              <div className="flex items-center gap-2">
                 <div className="flex items-center gap-1 rounded-md border border-white/5 bg-white/[0.03] px-1.5 py-1 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                  Enter to save
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

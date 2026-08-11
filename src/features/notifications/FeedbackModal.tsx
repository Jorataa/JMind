"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useUserName } from "@/stores/use-ui-store";
import { usePathname } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
}

const CATEGORIES = [
  { id: "Idea", label: "Idea" },
  { id: "Bug", label: "Bug" },
  { id: "Improvement", label: "Improvement" },
  { id: "Something I like", label: "Something I like" },
  { id: "Something confusing", label: "Something confusing" },
  { id: "Other", label: "Other" },
];

export function FeedbackModal({ isOpen, onClose, initialCategory = "Idea" }: FeedbackModalProps) {
  const userName = useUserName();
  const pathname = usePathname();

  const [category, setCategory] = useState(initialCategory);
  const [message, setMessage] = useState("");
  const [includePath, setIncludePath] = useState(false);
  const [includeDevice, setIncludeDevice] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Sync category with initialCategory when modal opens
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setCategory(initialCategory);
      setError(null);
      setSuccess(false);
    }
  }


  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    const contextPayload: Record<string, string> = {};
    if (includePath) {
      contextPayload.path = pathname;
    }
    if (includeDevice && typeof window !== "undefined") {
      contextPayload.browser = navigator.userAgent;
      contextPayload.screenSize = `${window.innerWidth}x${window.innerHeight}`;
    }

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          message: message.trim(),
          userName: userName || "Anonymous",
          context: Object.keys(contextPayload).length > 0 ? contextPayload : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit feedback.");
      }

      setSuccess(true);
    } catch {
      setError("Couldn't send your feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setMessage("");
    setIncludePath(false);
    setIncludeDevice(false);
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (success) {
    return (
      <Modal title="Thanks for helping shape Jorata." onClose={resetAndClose}>
        <div className="flex flex-col gap-3 py-2">
          <p className="text-[13.5px] leading-relaxed text-ink-700">
            The feedback has been sent.
          </p>
          <div className="mt-4 flex justify-end">
            <Button variant="primary" size="sm" onClick={resetAndClose}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Help improve Jorata"
      description="Tell us what’s working, what isn’t, or what you’d like to see next."
      onClose={resetAndClose}
      className="max-w-[460px]"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Category Grid */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11.5px] font-medium uppercase tracking-[0.14em] text-ink-500">
            Feedback type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "rounded-lg px-3 py-2 text-[12.5px] font-medium text-left transition-all duration-150 border",
                    isSelected
                      ? "border-emerald-600 bg-sage-surface text-ink-900 font-semibold"
                      : "border-line-hair bg-paper text-ink-700 hover:border-line-strong"
                  )}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Message Input */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="feedback-message" className="text-[11.5px] font-medium uppercase tracking-[0.14em] text-ink-500">
              Your feedback
            </label>
            <span className="font-mono text-[10.5px] text-ink-400">
              {message.length} / 1000
            </span>
          </div>
          <textarea
            id="feedback-message"
            autoFocus
            rows={4}
            maxLength={1000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full rounded-inner border border-line-hair bg-paper p-3 text-[13.5px] text-ink-900 placeholder:text-ink-400 outline-none transition-colors focus:border-emerald-500 custom-scrollbar resize-none"
          />
        </div>

        {/* Optional Context Checkboxes */}
        <div className="flex flex-col gap-2 rounded-inner border border-line-hair bg-sunken/30 p-3 text-[12px]">
          <span className="font-semibold text-ink-900 text-[12px]">
            Optional context
          </span>
          
          <label className="flex items-center gap-2 cursor-pointer text-ink-700 hover:text-ink-900">
            <input
              type="checkbox"
              checked={includePath}
              onChange={(e) => setIncludePath(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-line-strong text-emerald-600 focus:ring-emerald-500"
            />
            <span>Current page (<code className="text-[11px] text-ink-500">{pathname}</code>)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-ink-700 hover:text-ink-900">
            <input
              type="checkbox"
              checked={includeDevice}
              onChange={(e) => setIncludeDevice(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-line-strong text-emerald-600 focus:ring-emerald-500"
            />
            <span>Device and browser information</span>
          </label>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center justify-between rounded-inner border border-clay-border bg-clay-bg px-3 py-2 text-[12px] text-clay-text">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0 text-clay-500" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              className="font-semibold underline hover:text-clay-500 ml-2"
            >
              Try again
            </button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-1 flex items-center justify-between border-t border-line-soft pt-3.5">
          <Button variant="secondary" size="sm" type="button" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={!message.trim() || submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Sending…
              </>
            ) : (
              "Send feedback"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

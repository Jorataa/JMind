"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type { AiChatMessage } from "./useAiChat";

interface AiMessageProps {
  message: AiChatMessage;
  onFeedback?: (rating: "up" | "down") => void;
}

export default function AiMessage({ message, onFeedback }: AiMessageProps) {
  const isUser = message.role === "user";
  const [rated, setRated] = useState<"up" | "down" | null>(null);

  const handleRate = (rating: "up" | "down") => {
    if (rated) return;
    setRated(rating);
    onFeedback?.(rating);
  };

  return (
    <div className={cn("group flex w-full flex-col", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
          isUser
            ? "bg-emerald-500/15 text-emerald-50 border border-emerald-500/20"
            : "bg-white/[0.04] text-zinc-200 border border-white/10"
        )}
      >
        {message.text}
      </div>

      {/* Feedback row — AI messages only, hidden until hover or after rating */}
      {!isUser && onFeedback && (
        <div
          className={cn(
            "mt-1 flex items-center gap-1 transition-opacity",
            rated ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <button
            type="button"
            onClick={() => handleRate("up")}
            disabled={rated !== null}
            aria-label="Helpful"
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-md transition-colors",
              rated === "up"
                ? "text-emerald-400"
                : "text-zinc-600 hover:text-zinc-300 disabled:pointer-events-none"
            )}
          >
            <ThumbsUp size={12} />
          </button>
          <button
            type="button"
            onClick={() => handleRate("down")}
            disabled={rated !== null}
            aria-label="Not helpful"
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-md transition-colors",
              rated === "down"
                ? "text-rose-400"
                : "text-zinc-600 hover:text-zinc-300 disabled:pointer-events-none"
            )}
          >
            <ThumbsDown size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

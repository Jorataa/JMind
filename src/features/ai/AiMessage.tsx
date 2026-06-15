"use client";

import { cn } from "@/lib/cn";
import type { AiChatMessage } from "./useAiChat";

// One chat bubble. User messages hug the right with a subtle emerald tint;
// AI messages hug the left in a neutral card — the classic chat read.
export default function AiMessage({ message }: { message: AiChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
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
    </div>
  );
}

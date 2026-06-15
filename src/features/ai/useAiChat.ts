"use client";

import { useCallback, useState } from "react";

// A single chat message. `id` lets React key the list cleanly.
export interface AiChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
}

// Talks to our own /api/ai route (never to Gemini directly — the key is
// server-side). Returns the assistant reply text, or throws with a friendly
// message the UI can show.
async function callAi(payload: { message?: string; mindMapNodes?: string[] }): Promise<string> {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error ?? "Something went wrong talking to the AI.");
  }

  return data.reply as string;
}

/**
 * Owns the AI chat conversation: the message list, a loading flag, and the
 * last error. Two ways to send: a typed message, or a mind-map "update" that
 * feeds the current node titles to the AI.
 */
export function useAiChat() {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const newId = () => crypto.randomUUID();

  // Shared send pipeline: optimistically show the user's bubble, call the API,
  // then append the AI reply (or record the error).
  const run = useCallback(
    async (userBubble: string, payload: { message?: string; mindMapNodes?: string[] }) => {
      setError(null);
      setIsLoading(true);
      setMessages((prev) => [...prev, { id: newId(), role: "user", text: userBubble }]);

      try {
        const reply = await callAi(payload);
        setMessages((prev) => [...prev, { id: newId(), role: "ai", text: reply }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error.");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const sendMessage = useCallback(
    (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || isLoading) return;
      void run(trimmed, { message: trimmed });
    },
    [isLoading, run]
  );

  const updateWithMindMap = useCallback(
    (nodes: string[]) => {
      const titles = nodes.map((n) => n.trim()).filter(Boolean);
      if (titles.length === 0 || isLoading) return;
      void run("Update me with the latest info on my mind map topics.", {
        mindMapNodes: titles,
      });
    },
    [isLoading, run]
  );

  return { messages, isLoading, error, sendMessage, updateWithMindMap };
}

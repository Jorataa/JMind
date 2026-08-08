"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";

interface Message {
  role: "user" | "model";
  text: string;
}

interface FeedbackState {
  name: string;
  rating: number;
  text: string;
}

const WELCOME_MESSAGE: Message = {
  role: "model",
  text: "Hey! I'm J, the AI behind Jorata 🧠 Jorata is a Personal OS for Thinking and Execution — built for people who want to think clearly and get things done. What do you do — are you a student, freelancer, founder, or something else?",
};

export default function DemoPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatError, setChatError] = useState("");

  const [feedback, setFeedback] = useState<FeedbackState>({ name: "", rating: 0, text: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: Message = { role: "user", text };
    const history = messages.slice(1); // exclude the welcome message from history sent to API
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setChatError("");

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, message: text }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setChatError(data.error ?? "Something went wrong.");
      } else {
        setMessages((prev) => [...prev, { role: "model", text: data.reply }]);
      }
    } catch {
      setChatError("Couldn't reach the server. Please try again.");
    } finally {
      setIsTyping(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function handleFeedbackSubmit(e: FormEvent) {
    e.preventDefault();
    if (!feedback.name || !feedback.rating || !feedback.text) return;
    setSubmitting(true);
    // Fire-and-forget — same visitor endpoint used by the name gate
    await fetch("/api/visitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: feedback.name,
        event: "demo_feedback",
        rating: feedback.rating,
        feedback: feedback.text,
      }),
    }).catch(() => {});
    setSubmitting(false);
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Meet J 🧠</h1>
        <p className="mt-2 text-gray-400 text-lg">
          Jorata&apos;s AI assistant — here to show you what&apos;s possible.
        </p>
      </div>

      {/* Chat window */}
      <div className="w-full max-w-2xl flex flex-col bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[480px]">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-gray-800 text-gray-100 rounded-bl-sm"
                }`}
              >
                {msg.role === "model" && (
                  <span className="block text-xs font-semibold text-indigo-400 mb-1">J</span>
                )}
                {msg.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-gray-400 italic">
                J is typing…
              </div>
            </div>
          )}

          {chatError && (
            <p className="text-center text-red-400 text-sm">{chatError}</p>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input row */}
        <div className="border-t border-gray-800 p-4 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            disabled={isTyping}
            className="flex-1 bg-gray-800 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={isTyping || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            Send
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full max-w-2xl my-10 flex items-center gap-4">
        <div className="flex-1 border-t border-gray-800" />
        <span className="text-gray-500 text-sm">Share your thoughts</span>
        <div className="flex-1 border-t border-gray-800" />
      </div>

      {/* Feedback form */}
      <div className="w-full max-w-2xl bg-gray-900 rounded-2xl border border-gray-800 p-8 shadow-xl">
        {submitted ? (
          <div className="text-center py-6">
            <p className="text-2xl font-bold mb-2">Thanks, {feedback.name}! 🙌</p>
            <p className="text-gray-400">Your feedback helps shape what Jorata becomes.</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-1">Leave feedback</h2>
            <p className="text-gray-400 text-sm mb-6">
              What would make Jorata indispensable for you?
            </p>

            <form onSubmit={handleFeedbackSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Your name</label>
                <input
                  type="text"
                  value={feedback.name}
                  onChange={(e) => setFeedback((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Alex"
                  required
                  className="w-full bg-gray-800 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Rating <span className="text-gray-500">(1 = meh, 5 = love it)</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFeedback((f) => ({ ...f, rating: n }))}
                      className={`w-10 h-10 rounded-lg text-sm font-semibold border transition-colors ${
                        feedback.rating === n
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-indigo-500"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Your feedback</label>
                <textarea
                  value={feedback.text}
                  onChange={(e) => setFeedback((f) => ({ ...f, text: e.target.value }))}
                  placeholder="What feature would make you use Jorata every day?"
                  required
                  rows={4}
                  className="w-full bg-gray-800 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !feedback.name || !feedback.rating || !feedback.text}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {submitting ? "Submitting…" : "Submit feedback"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

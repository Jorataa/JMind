import { NextResponse } from "next/server";

// gemini-1.5-flash was retired Sept 2025 — 2.5-flash is the free-tier replacement
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are J, the AI assistant for Jorata — a Personal OS for Thinking and Execution.
Your mission is to pitch Jorata to visitors in a warm, confident, and curious way.

Conversation flow:
1. Start by warmly greeting the visitor and asking what they do (student, freelancer, founder, professional, etc.)
2. Once they answer, connect Jorata's features directly to their situation with a concrete example
3. Pitch exactly these 4 features — one or two per reply, naturally woven into the conversation:
   • Task Management — capture, prioritize, and execute tasks without losing context
   • Mind Mapping — visually connect ideas so nothing slips through the cracks
   • KPI Tracking — measure what matters and see progress at a glance
   • Daily Wisdom — AI-curated insight to start each day with clarity
4. Boldly invite them to scroll down and leave feedback on what they'd love to see built

Rules:
- Keep every reply to 2–3 sentences max
- Always end with a single, engaging question
- Be enthusiastic but not pushy
- Use "you" language — make it personal to their situation`;

interface Message {
  role: "user" | "model";
  text: string;
}

interface AgentRequestBody {
  history: Message[];
  message: string;
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_key_here") {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set. Add it to .env.local and restart the dev server." },
      { status: 500 }
    );
  }

  let body: AgentRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const userMessage = String(body.message ?? "").trim().slice(0, 2000);
  if (!userMessage) {
    return NextResponse.json({ error: "Message is empty." }, { status: 400 });
  }

  // Build multi-turn conversation contents for Gemini
  const history = Array.isArray(body.history) ? body.history : [];
  const contents = [
    ...history.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: {
          maxOutputTokens: 512,
          temperature: 0.8,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("[Agent] Gemini error:", response.status, detail);
      return NextResponse.json(
        { error: "The AI service is unavailable right now. Please try again." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!reply) {
      return NextResponse.json(
        { error: "The AI didn't return a response. Try rephrasing." },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[Agent] Request failed:", error);
    return NextResponse.json(
      { error: "Couldn't reach the AI service. Check your connection." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { callGemini, GeminiError } from "@/lib/gemini";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

// 30 AI chat requests per IP per minute (generous for real users, stops bulk abuse).
const limiter = createRateLimiter({ limit: 30, windowMs: 60_000 });

// ─────────────────────────────────────────────────────────────────────────────
// Jorata AI — server-side Gemini bridge.
//
// WHY this lives on the server: the Gemini API key is a secret. If we called
// Gemini from the browser, anyone could open DevTools and steal the key. This
// route runs only on the server (Vercel), so the key never reaches the client.
//
// The actual Gemini call goes through callGemini() (src/lib/gemini.ts), which
// adds transient-5xx retry with backoff and model fallback — so a momentary
// "model overloaded" from Google's free tier self-heals instead of erroring.
// ─────────────────────────────────────────────────────────────────────────────

// Models to try in order: the proven flash, then lite as a fallback.
const CHAT_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

// Two personalities, picked based on what the client asked for.
const CHAT_SYSTEM_PROMPT =
  "You are Jorata AI, a helpful assistant inside a personal mind mapping and " +
  "productivity tool. Help the user think clearly, plan effectively, and " +
  "understand topics better. Keep responses concise and structured. Use bullet " +
  "points when helpful.";

const buildMindMapPrompt = (titles: string[]) =>
  `You are Jorata AI. The user has a mind map with the following topics: ` +
  `${titles.join(", ")}. Your job is to give them the latest, most relevant, ` +
  `and useful information about these topics. Structure your response clearly ` +
  `with each topic as a section. Keep it concise but informative. Focus on what ` +
  `would help someone who is thinking and planning around these topics.`;

// Input caps — keep request payloads (and Gemini token cost) bounded. They stop
// a giant paste or a runaway map from blowing up the request or the bill.
const MAX_MESSAGE_CHARS = 4000;
const MAX_NODES = 50;
const MAX_TITLE_CHARS = 200;

interface AiRequestBody {
  message?: string;
  mindMapNodes?: string[];
}

export async function POST(request: Request) {
  // Rate limit before doing any real work.
  const { success } = limiter.check(getClientIp(request));
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    // Don't leak deployment details (env var names, host platform) to callers.
    return NextResponse.json(
      { error: "The AI service is not configured." },
      { status: 503 }
    );
  }

  let body: AiRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Coerce every title to a string before trimming — the body is untrusted
  // JSON, so a stray number/null shouldn't crash the route. Then bound both the
  // per-title length and the total node count.
  const nodes = (Array.isArray(body.mindMapNodes) ? body.mindMapNodes : [])
    .map((title) => String(title ?? "").trim().slice(0, MAX_TITLE_CHARS))
    .filter((title) => title.length > 0)
    .slice(0, MAX_NODES);
  const isMindMapMode = nodes.length > 0;

  // In mind-map mode the node titles ARE the prompt; in chat mode we need the
  // user's typed message. String() guards against a non-string `message`.
  const userMessage = isMindMapMode
    ? "Give me the latest, most relevant information about my mind map topics."
    : String(body.message ?? "").trim();

  if (!isMindMapMode && !userMessage) {
    return NextResponse.json({ error: "Message is empty." }, { status: 400 });
  }

  if (!isMindMapMode && userMessage.length > MAX_MESSAGE_CHARS) {
    return NextResponse.json(
      { error: `Message is too long — keep it under ${MAX_MESSAGE_CHARS} characters.` },
      { status: 400 }
    );
  }

  const systemPrompt = isMindMapMode ? buildMindMapPrompt(nodes) : CHAT_SYSTEM_PROMPT;

  try {
    const reply = await callGemini({
      system: systemPrompt,
      user: userMessage,
      models: CHAT_MODELS,
      maxOutputTokens: 2048,
      temperature: 0.7,
    });
    return NextResponse.json({ reply });
  } catch (error) {
    if (error instanceof GeminiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[Jorata AI] Request failed:", error);
    return NextResponse.json(
      { error: "Couldn't reach the AI service. Check your connection and try again." },
      { status: 500 }
    );
  }
}

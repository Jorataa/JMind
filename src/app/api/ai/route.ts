import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// Jorata AI — server-side Gemini bridge.
//
// WHY this lives on the server: the Gemini API key is a secret. If we called
// Gemini from the browser, anyone could open DevTools and steal the key. This
// route runs only on the server (Vercel), so the key never reaches the client.
// ─────────────────────────────────────────────────────────────────────────────

// The Gemini model. Kept as ONE constant so it's a one-line change later.
// NOTE: the original spec asked for "gemini-1.5-flash", but Google retired the
// 1.5 series in Sept 2025 — it now returns 404. "gemini-2.5-flash" is the
// current FREE-tier replacement.
const GEMINI_MODEL = "gemini-2.5-flash";

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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
  const apiKey = process.env.GEMINI_API_KEY;

  // Guard: a missing/placeholder key is the #1 setup mistake. Say so plainly
  // instead of letting Gemini return a cryptic 400.
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return NextResponse.json(
      {
        error:
          "GEMINI_API_KEY is not set. Add it to .env.local (and to Vercel's " +
          "Environment Variables), then restart the dev server.",
      },
      { status: 500 }
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
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      // Send the key as a header instead of a `?key=` query param so it can't
      // leak into any URL/access log along the request path.
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
          // gemini-2.5-flash "thinks" before replying, and those hidden
          // thinking tokens count against maxOutputTokens. Left on, longer
          // answers get truncated (finishReason: MAX_TOKENS) or come back
          // empty. This is a fast chat helper, so switch thinking off for
          // complete, snappy replies.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!response.ok) {
      // Surface Gemini's own message in the server log; keep the client message
      // friendly and non-leaky.
      const detail = await response.text();
      console.error("[Jorata AI] Gemini error:", response.status, detail);
      return NextResponse.json(
        { error: "The AI service is unavailable right now. Please try again." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!reply) {
      // Empty completions usually mean a safety block or token cutoff.
      return NextResponse.json(
        { error: "The AI didn't return a response. Try rephrasing." },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[Jorata AI] Request failed:", error);
    return NextResponse.json(
      { error: "Couldn't reach the AI service. Check your connection and try again." },
      { status: 500 }
    );
  }
}

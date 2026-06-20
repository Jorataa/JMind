// ─────────────────────────────────────────────────────────────────────────────
// Shared server-side Gemini caller.
//
// One place that knows how to talk to the Gemini REST API: key handling, the
// header-based auth (so the key never lands in a URL/access log), thinking-token
// suppression, and graceful fallback across models. Routes import this instead
// of re-implementing the fetch each time.
//
// SERVER ONLY — never import this into a client component; it reads the secret
// GEMINI_API_KEY from the environment.
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

/** A Gemini failure that already carries the HTTP status a route should return. */
export class GeminiError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
  }
}

interface CallGeminiOptions {
  /** System instruction — the model's role and rules. */
  system: string;
  /** The user turn — the actual topic/question. */
  user: string;
  /**
   * Models to try, in order. The first that exists is used; a 404 (model not
   * available to this key/region) falls through to the next. Defaults to the
   * app-wide chat model.
   */
  models?: string[];
  /** Force a strict JSON response (responseMimeType: application/json). */
  json?: boolean;
  maxOutputTokens?: number;
  temperature?: number;
}

// Any value left at a "your_…" scaffold counts as unset — covers
// `your_gemini_api_key_here`, `your_key_here`, etc.
const isPlaceholderKey = (key: string) => key.trim().toLowerCase().startsWith("your_");

/**
 * Calls Gemini and returns the raw text of the first candidate. Throws a
 * GeminiError (with an appropriate HTTP status) on any failure so callers can
 * map it straight onto a response.
 */
export async function callGemini({
  system,
  user,
  models = ["gemini-2.5-flash"],
  json = false,
  maxOutputTokens = 2048,
  temperature = 0.7,
}: CallGeminiOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || isPlaceholderKey(apiKey)) {
    throw new GeminiError(
      "GEMINI_API_KEY is not set. Add it to .env.local (and to Vercel's " +
        "Environment Variables), then restart the dev server.",
      500
    );
  }

  const body = JSON.stringify({
    contents: [{ parts: [{ text: user }] }],
    systemInstruction: { parts: [{ text: system }] },
    generationConfig: {
      maxOutputTokens,
      temperature,
      ...(json ? { responseMimeType: "application/json" } : {}),
      // 2.5 models "think" before answering, and those hidden tokens eat into
      // maxOutputTokens — left on, longer answers truncate or come back empty.
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  let lastError: GeminiError | null = null;

  for (const model of models) {
    const response = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body,
    });

    // Model not available to this key/region — try the next one in the list.
    if (response.status === 404) {
      lastError = new GeminiError(`Model "${model}" is unavailable.`, 502);
      continue;
    }

    if (!response.ok) {
      const detail = await response.text();
      console.error("[JMind AI] Gemini error:", response.status, detail);
      throw new GeminiError("The AI service is unavailable right now.", 502);
    }

    const data = await response.json();
    const text: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
      // Usually a safety block or a token cutoff.
      throw new GeminiError("The AI didn't return a response.", 502);
    }

    return text;
  }

  throw lastError ?? new GeminiError("No usable AI model was found.", 502);
}

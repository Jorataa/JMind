import { NextResponse } from "next/server";
import { callGemini, GeminiError } from "@/lib/gemini";
import { normalizeAiTree } from "@/lib/mindmap-ai";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/mindmap — generate a complete mind map from a single topic.
//
// Body: { prompt: string }
// Returns: { tree: { title, children[] } }  (validated, depth/breadth capped)
// ─────────────────────────────────────────────────────────────────────────────

const MAX_PROMPT_CHARS = 200;

// Lead with gemini-2.5-flash — the same model the chat route uses successfully.
// gemini-2.5-flash-lite stays as a secondary fallback (callGemini now falls
// through to it on any error, not just a 404).
const GENERATION_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

const SYSTEM_PROMPT = `You are an expert mind map generator.
Return ONLY valid JSON.

Rules:
- Maximum depth: 4
- Maximum children per node: 6
- Keep titles short (a few words, no sentences)
- No markdown
- No explanation
- No numbering
- Balanced hierarchy
- Educational and structured

Return an object of this exact shape:
{ "title": "", "children": [ { "title": "", "children": [] } ] }`;

/**
 * Pulls the JSON object out of the model's reply. Strips a ```json … ``` fence
 * if present, then — as a belt-and-braces step for when the model adds a stray
 * sentence around the JSON — slices to the outermost { … } before parsing.
 */
function parseJson(text: string): unknown {
  let cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last > first) {
    cleaned = cleaned.slice(first, last + 1);
  }

  return JSON.parse(cleaned);
}

export async function POST(request: Request) {
  let body: { prompt?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const prompt = String(body.prompt ?? "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "Please enter a topic." }, { status: 400 });
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    return NextResponse.json(
      { error: `Topic is too long — keep it under ${MAX_PROMPT_CHARS} characters.` },
      { status: 400 }
    );
  }

  try {
    // No responseMimeType:json — we send the exact request shape as the working
    // chat route and lean on the strict prompt + parseJson() to extract the
    // object. (Forcing JSON mode was a second variable that differed from the
    // route that works.)
    const raw = await callGemini({
      system: SYSTEM_PROMPT,
      user: `Topic:\n${prompt}`,
      models: GENERATION_MODELS,
      temperature: 0.6,
    });

    let tree;
    try {
      tree = normalizeAiTree(parseJson(raw));
    } catch (error) {
      console.error("[Jorata AI] Mind map JSON parse failed:", error, raw);
      tree = null;
    }

    if (!tree) {
      return NextResponse.json(
        { error: "The AI returned an unexpected format. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ tree });
  } catch (error) {
    if (error instanceof GeminiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[Jorata AI] Mind map generation failed:", error);
    return NextResponse.json(
      { error: "Couldn't reach the AI service. Please try again." },
      { status: 500 }
    );
  }
}

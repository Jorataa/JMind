import { NextResponse } from "next/server";
import { callGemini, GeminiError } from "@/lib/gemini";
import { normalizeAiTree, childIdeas, type AiChildIdea } from "@/lib/mindmap-ai";
import { applyRateLimit, rejectOversizedBody } from "@/lib/rate-limit";

// Cap anonymous callers — this route forwards to the owner's quota'd Gemini key.
const AI_RATE_LIMIT = { limit: 20, windowMs: 60_000 };
const MAX_BODY_BYTES = 64 * 1024;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/expand-node — suggest child ideas for ONE existing node.
//
// Body: { node: string, root?: string, mode?: "expand" | "simplify" | "counter" }
//   node  — the title of the node being expanded
//   root  — the overall map topic, for context (optional)
//   mode  — the thinking verb (§6.6 node toolbar): grow, restate simply,
//           or argue against. Defaults to "expand".
// Returns: { children: [{ title, category?, description? }] }  (one level)
// ─────────────────────────────────────────────────────────────────────────────

const MAX_TITLE_CHARS = 200;

// Lead with the proven gemini-2.5-flash; lite stays as a fallback (callGemini
// now falls through to it on any error, not just a 404).
const EXPANSION_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

const SHARED_RULES = `Return ONLY valid JSON — no preamble, no markdown fences.

Rules:
- ONE level deep (each child has an empty children array)
- Keep titles short (a few words, no sentences)
- Every child gets a "description": one plain, calm sentence (under 120 characters). Write like a calm friend — no hype, no gamified or corporate language.
- Every child gets a "category": one of "goal" (an outcome to reach), "task" (a concrete action), "idea" (a concept or thought), "warning" (a risk or caution), or "default" (none of those clearly fit).
- No markdown
- No explanation outside the JSON
- No numbering

Return an object of this exact shape:
{ "title": "", "children": [ { "title": "", "category": "", "description": "", "children": [] } ] }`;

const MODE_PROMPTS: Record<string, string> = {
  expand: `You are an expert mind map generator expanding ONE node of an existing mind map.
- Provide 4 to 6 children: relevant sub-topics of the node, within the overall map's context
${SHARED_RULES}`,
  simplify: `You are a clear thinker restating ONE node of a mind map more simply.
- Provide 2 to 3 children: plainer, more concrete reformulations or the smallest useful pieces of the idea
- Each child should be simpler and more actionable than the original node
${SHARED_RULES}`,
  counter: `You are a thoughtful devil's advocate examining ONE node of a mind map.
- Provide 2 to 3 children: honest counterpoints, risks, or opposing considerations for this idea
- Mark genuinely risky ones with category "warning"
${SHARED_RULES}`,
};

function parseJson(text: string): unknown {
  let cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  // Slice to the outermost { … } in case the model adds stray prose.
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last > first) {
    cleaned = cleaned.slice(first, last + 1);
  }

  return JSON.parse(cleaned);
}

export async function POST(request: Request) {
  const tooBig = rejectOversizedBody(request, MAX_BODY_BYTES);
  if (tooBig) return tooBig;

  const limited = applyRateLimit(request, AI_RATE_LIMIT);
  if (limited) return limited;

  let body: { node?: unknown; root?: unknown; mode?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const node = String(body.node ?? "").trim().slice(0, MAX_TITLE_CHARS);
  const root = String(body.root ?? "").trim().slice(0, MAX_TITLE_CHARS);
  const mode = typeof body.mode === "string" && body.mode in MODE_PROMPTS ? body.mode : "expand";
  if (!node) {
    return NextResponse.json({ error: "No node provided to expand." }, { status: 400 });
  }

  const userPrompt = root
    ? `Overall map topic: ${root}\nNode to expand: ${node}`
    : `Node to expand: ${node}`;

  try {
    const raw = await callGemini({
      system: MODE_PROMPTS[mode],
      user: userPrompt,
      models: EXPANSION_MODELS,
      temperature: 0.7,
    });

    let children: AiChildIdea[] = [];
    try {
      const tree = normalizeAiTree(parseJson(raw));
      children = tree ? childIdeas(tree) : [];
    } catch (error) {
      console.error("[Jorata AI] Expand JSON parse failed:", error, raw);
    }

    if (children.length === 0) {
      return NextResponse.json(
        { error: "The AI returned an unexpected format. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ children });
  } catch (error) {
    if (error instanceof GeminiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[Jorata AI] Node expansion failed:", error);
    return NextResponse.json(
      { error: "Couldn't reach the AI service. Please try again." },
      { status: 500 }
    );
  }
}

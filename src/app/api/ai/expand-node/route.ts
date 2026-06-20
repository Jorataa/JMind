import { NextResponse } from "next/server";
import { callGemini, GeminiError } from "@/lib/gemini";
import { normalizeAiTree, childTitles } from "@/lib/mindmap-ai";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/expand-node — suggest child ideas for ONE existing node.
//
// Body: { node: string, root?: string }
//   node  — the title of the node being expanded
//   root  — the overall map topic, for context (optional)
// Returns: { children: string[] }  (4–6 short, one-level-deep titles)
// ─────────────────────────────────────────────────────────────────────────────

const MAX_TITLE_CHARS = 200;

const EXPANSION_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];

const SYSTEM_PROMPT = `You are an expert mind map generator expanding ONE node of an existing mind map.
Return ONLY valid JSON.

Rules:
- Provide 4 to 6 children, ONE level deep (each child has an empty children array)
- Children must be relevant sub-topics of the node, within the overall map's context
- Keep titles short (a few words, no sentences)
- No markdown
- No explanation
- No numbering

Return an object of this exact shape:
{ "title": "", "children": [ { "title": "", "children": [] } ] }`;

function parseJson(text: string): unknown {
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

export async function POST(request: Request) {
  let body: { node?: unknown; root?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const node = String(body.node ?? "").trim().slice(0, MAX_TITLE_CHARS);
  const root = String(body.root ?? "").trim().slice(0, MAX_TITLE_CHARS);
  if (!node) {
    return NextResponse.json({ error: "No node provided to expand." }, { status: 400 });
  }

  const userPrompt = root
    ? `Overall map topic: ${root}\nNode to expand: ${node}`
    : `Node to expand: ${node}`;

  try {
    const raw = await callGemini({
      system: SYSTEM_PROMPT,
      user: userPrompt,
      models: EXPANSION_MODELS,
      json: true,
      temperature: 0.7,
    });

    let children: string[] = [];
    try {
      const tree = normalizeAiTree(parseJson(raw));
      children = tree ? childTitles(tree) : [];
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

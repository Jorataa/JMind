import { NextResponse } from "next/server";
import { callGemini, GeminiError } from "@/lib/gemini";
import { normalizeFixOperations, type FixOperation } from "@/lib/mindmap-fix";
import { applyRateLimit, rejectOversizedBody } from "@/lib/rate-limit";

// Cap anonymous callers — this route forwards to the owner's quota'd Gemini key.
const AI_RATE_LIMIT = { limit: 20, windowMs: 60_000 };
const MAX_BODY_BYTES = 64 * 1024;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/fix-map — review a whole map's structure and PROPOSE fixes.
//
// Body: { title, nodes: [{ id, label, category }], edges: [{ source, target, freeform? }] }
// Returns: { operations: FixOperation[] } — validated proposals only. Nothing
// here touches the user's map; the client shows a review list and the user
// decides what (if anything) gets applied.
// ─────────────────────────────────────────────────────────────────────────────

// Bounds mirror the chat route's map-context caps: full structure, not
// node-by-node, but capped so a giant map can't blow up the token bill.
const MAX_NODES = 60;
const MAX_EDGES = 150;
const MAX_TITLE_CHARS = 120;

const FIX_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

const SYSTEM_PROMPT = `You are reviewing the structure of an existing mind map.
Return ONLY valid JSON — no preamble, no markdown fences.

The map is given as nodes (with short ids like "n1") and edges. Solid edges are parent→child hierarchy; edges marked "freeform" are loose lateral links, not hierarchy. The root node is the map's main topic.

Look for:
- Orphan nodes: no parent and no connections → propose "connect" to the most fitting parent
- Duplicate or near-duplicate nodes → propose "merge" of one into the other
- Weak hierarchy: a node that clearly belongs under a different parent → propose "move"
- Mis-categorized nodes → propose "recategorize". Categories: "goal" (an outcome to reach), "task" (a concrete action), "idea" (a concept or thought), "warning" (a risk or caution), "default" (none clearly fit)
- Vague or unclear labels → propose "rename" (short, a few words)

Rules:
- Propose at most 15 operations, only ones that genuinely improve the map
- Never target the root node
- Use only the node ids given
- Each operation needs a "reason": one plain, calm sentence (under 140 characters). Write like a calm friend — no hype, no gamified or corporate language, never imply the user did badly.
- If the structure already looks sound, return an empty list

Return an object of this exact shape (include only the fields each type needs):
{ "operations": [
  { "type": "connect", "nodeId": "", "parentId": "", "reason": "" },
  { "type": "move", "nodeId": "", "parentId": "", "reason": "" },
  { "type": "recategorize", "nodeId": "", "category": "", "reason": "" },
  { "type": "rename", "nodeId": "", "label": "", "reason": "" },
  { "type": "merge", "nodeId": "", "intoNodeId": "", "reason": "" }
] }`;

/** Same fence-stripping + outermost-object slice as the other AI routes. */
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

interface FixRequestNode {
  id: string;
  label: string;
  category: string;
  isRoot: boolean;
}

interface FixRequestEdge {
  source: string;
  target: string;
  freeform: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export async function POST(request: Request) {
  const tooBig = rejectOversizedBody(request, MAX_BODY_BYTES);
  if (tooBig) return tooBig;

  const limited = applyRateLimit(request, AI_RATE_LIMIT);
  if (limited) return limited;

  let body: { title?: unknown; nodes?: unknown; edges?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Coerce + bound the untrusted payload before it goes anywhere near a prompt.
  const nodes: FixRequestNode[] = (Array.isArray(body.nodes) ? body.nodes : [])
    .filter(isRecord)
    .map((n) => ({
      id: String(n.id ?? "").trim(),
      label: String(n.label ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_TITLE_CHARS),
      category: String(n.category ?? "default").trim().slice(0, 20),
      isRoot: n.isRoot === true,
    }))
    .filter((n) => n.id.length > 0 && n.label.length > 0)
    .slice(0, MAX_NODES);

  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges: FixRequestEdge[] = (Array.isArray(body.edges) ? body.edges : [])
    .filter(isRecord)
    .map((e) => ({
      source: String(e.source ?? "").trim(),
      target: String(e.target ?? "").trim(),
      freeform: e.freeform === true,
    }))
    .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target) && e.source !== e.target)
    .slice(0, MAX_EDGES);

  if (nodes.length < 3) {
    return NextResponse.json(
      { error: "This map is still small — add a few more ideas first." },
      { status: 400 }
    );
  }

  const rootNode = nodes.find((n) => n.isRoot) ?? nodes[0];

  // Alias real node ids (UUIDs) to n1…nN for the prompt: fewer tokens, and the
  // model can't mangle a short handle the way it can a 36-char UUID. Everything
  // it returns is translated back before validation.
  const aliasById = new Map<string, string>();
  const idByAlias = new Map<string, string>();
  nodes.forEach((n, i) => {
    const alias = `n${i + 1}`;
    aliasById.set(n.id, alias);
    idByAlias.set(alias, n.id);
  });

  const promptMap = {
    title: String(body.title ?? "").trim().slice(0, MAX_TITLE_CHARS) || rootNode.label,
    rootId: aliasById.get(rootNode.id),
    nodes: nodes.map((n) => ({
      id: aliasById.get(n.id),
      label: n.label,
      category: n.category,
    })),
    edges: edges.map((e) => ({
      source: aliasById.get(e.source),
      target: aliasById.get(e.target),
      ...(e.freeform ? { freeform: true } : {}),
    })),
  };

  try {
    const raw = await callGemini({
      system: SYSTEM_PROMPT,
      user: `Mind map to review:\n${JSON.stringify(promptMap)}`,
      models: FIX_MODELS,
      temperature: 0.4,
    });

    let operations: FixOperation[] | null = null;
    try {
      const parsed = parseJson(raw);
      // Translate aliases back to real ids, then validate hard: unknown ids,
      // bad types, and root-targeting ops are all dropped server-side.
      const translated = isRecord(parsed) && Array.isArray(parsed.operations)
        ? {
            operations: parsed.operations.filter(isRecord).map((op) => ({
              ...op,
              nodeId: idByAlias.get(String(op.nodeId ?? "")) ?? "",
              ...(op.parentId != null
                ? { parentId: idByAlias.get(String(op.parentId)) ?? "" }
                : {}),
              ...(op.intoNodeId != null
                ? { intoNodeId: idByAlias.get(String(op.intoNodeId)) ?? "" }
                : {}),
            })),
          }
        : parsed;
      operations = normalizeFixOperations(translated, nodeIds, rootNode.id);
    } catch (error) {
      console.error("[Jorata AI] Fix-map JSON parse failed:", error, raw);
    }

    if (operations === null) {
      return NextResponse.json(
        { error: "The AI returned an unexpected format. Please try again." },
        { status: 502 }
      );
    }

    // An empty list is a valid, happy outcome: the structure looks sound.
    return NextResponse.json({ operations });
  } catch (error) {
    if (error instanceof GeminiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[Jorata AI] Fix-map review failed:", error);
    return NextResponse.json(
      { error: "Couldn't reach the AI service. Please try again." },
      { status: 500 }
    );
  }
}

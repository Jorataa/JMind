import { NextResponse } from "next/server";
import { callGemini, GeminiError } from "@/lib/gemini";
import { applyRateLimit, rejectOversizedBody } from "@/lib/rate-limit";

// Summaries fan out to a fetch + an LLM call — keep the lid tighter than chat.
const AI_RATE_LIMIT = { limit: 10, windowMs: 60_000 };
const MAX_BODY_BYTES = 8 * 1024;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/summarize — read a saved web source and distill it.
//
// Body: { url: string, title?: string }
// Returns: { summary: string, keyPoints: string[] }
//
// Only public http(s) pages: the server fetches the URL, extracts readable
// text, and asks Gemini for a short summary plus key points. PDFs and video
// transcripts are out of scope for this MVP — the client disables the action
// for those source types with an honest explanation.
// ─────────────────────────────────────────────────────────────────────────────

// Reading + distilling can take a few seconds — set to max allowed for Hobby plan (10s).
export const maxDuration = 10;

const FETCH_TIMEOUT_MS = 14_000;
const FETCH_ATTEMPTS = 2; // one immediate retry — most network blips clear at once
const MAX_HTML_BYTES = 1_500_000; // read cap — huge pages get truncated
const MAX_TEXT_CHARS = 14_000; // what actually goes to the model

const SUMMARY_PROMPT = `You summarize saved reading for a calm thinking tool.
Given the text of a web page, return ONLY valid JSON of this exact shape:
{ "summary": "", "keyPoints": ["", ""] }

Rules:
- "summary": 3 to 5 plain sentences capturing what the page says and why it matters. Write like a calm, well-read friend — no hype, no filler like "This article discusses".
- "keyPoints": 3 to 5 short standalone takeaways (each under 120 characters).
- Use only what is in the text. If the text is too thin or looks like an error/login page, set summary to exactly "UNREADABLE" and keyPoints to [].
- No markdown, no explanation outside the JSON.`;

/** Private/loopback hosts are never fetched — this endpoint is public. */
function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    return true;
  }
  // IPv6 loopback/link-local, and anything bracket-wrapped we can't vouch for.
  if (host.includes(":")) return true;
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;
  const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

/** Cheap readable-text extraction: prefer <article>/<main>, strip the rest. */
function htmlToText(html: string): string {
  let scope = html;
  const article = html.match(/<article[\s\S]*?<\/article>/i);
  const main = html.match(/<main[\s\S]*?<\/main>/i);
  if (article && article[0].length > 800) scope = article[0];
  else if (main && main[0].length > 800) scope = main[0];

  const text = scope
    .replace(/<(script|style|noscript|svg|iframe|head|nav|footer)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text.slice(0, MAX_TEXT_CHARS);
}

export async function POST(request: Request) {
  const tooBig = rejectOversizedBody(request, MAX_BODY_BYTES);
  if (tooBig) return tooBig;

  const limited = applyRateLimit(request, AI_RATE_LIMIT);
  if (limited) return limited;

  let body: { url?: unknown; title?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rawUrl = String(body.url ?? "").trim();
  const title = String(body.title ?? "").trim().slice(0, 200);
  if (!rawUrl) {
    return NextResponse.json({ error: "No link to read." }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
  } catch {
    return NextResponse.json({ error: "That doesn't look like a valid link." }, { status: 400 });
  }
  if (!/^https?:$/.test(target.protocol) || isBlockedHost(target.hostname)) {
    return NextResponse.json({ error: "That link can't be read from here." }, { status: 400 });
  }

  // ── Fetch the page (one retry — transient DNS/TLS blips are common) ──
  let html: string | null = null;
  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(target, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        redirect: "follow",
        headers: {
          // Some sites gate bare fetches; a browser-ish UA keeps it honest text.
          "User-Agent":
            "Mozilla/5.0 (compatible; JorataReader/1.0; +https://jorata.vercel.app)",
          Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5",
        },
      });
      if (!response.ok) {
        return NextResponse.json(
          { error: `The site answered ${response.status} — couldn't read the page.` },
          { status: 422 }
        );
      }
      const contentType = response.headers.get("content-type") ?? "";
      if (!/text\/html|text\/plain|application\/xhtml/i.test(contentType)) {
        return NextResponse.json(
          { error: "That link isn't a readable page (it may be a file or media)." },
          { status: 422 }
        );
      }
      html = (await response.text()).slice(0, MAX_HTML_BYTES);
      break;
    } catch (error) {
      console.error(
        `[Jorata AI] Source fetch failed (attempt ${attempt}/${FETCH_ATTEMPTS}):`,
        target.href,
        error instanceof Error ? `${error.name}: ${error.message}` : error
      );
      if (attempt === FETCH_ATTEMPTS) {
        return NextResponse.json(
          { error: "Couldn't reach that site — it may be slow or blocking readers." },
          { status: 422 }
        );
      }
    }
  }
  if (html === null) {
    return NextResponse.json(
      { error: "Couldn't reach that site — it may be slow or blocking readers." },
      { status: 422 }
    );
  }

  const text = htmlToText(html);
  if (text.length < 400) {
    return NextResponse.json(
      { error: "The page didn't give enough readable text to summarize." },
      { status: 422 }
    );
  }

  // ── Distill ──
  try {
    const raw = await callGemini({
      system: SUMMARY_PROMPT,
      user: `${title ? `Page title: ${title}\n` : ""}URL: ${target.href}\n\nPage text:\n${text}`,
      // Summaries are light lifting — lead with lite to spread daily quota.
      models: ["gemini-2.5-flash-lite", "gemini-2.5-flash"],
      json: true,
      maxOutputTokens: 1024,
      temperature: 0.4,
    });

    let parsed: { summary?: unknown; keyPoints?: unknown };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "The AI returned an unexpected format. Please try again." },
        { status: 502 }
      );
    }

    const summary = String(parsed.summary ?? "").trim();
    const keyPoints = (Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [])
      .map((p) => String(p).trim())
      .filter(Boolean)
      .slice(0, 6);

    if (!summary || summary === "UNREADABLE") {
      return NextResponse.json(
        { error: "That page didn't have enough substance to summarize." },
        { status: 422 }
      );
    }

    return NextResponse.json({ summary, keyPoints });
  } catch (error) {
    if (error instanceof GeminiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[Jorata AI] Summarize failed:", error);
    return NextResponse.json(
      { error: "Couldn't reach the AI service. Please try again." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// AI feedback log — server-side bridge to the "AI Feedback" tab in the sheet.
//
// The browser POSTs a thumbs-up or thumbs-down after an AI reply. This route
// enriches it (device/IP are server-only) and forwards it to the same Google
// Apps Script webhook used by /api/visitor. The Apps Script routes rows with
// type:"ai_feedback" to a dedicated sheet tab so visitor and feedback data
// stay separate.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_TEXT = 2000;
const MAX_FIELD = 300;

const clean = (value: unknown, max: number) =>
  String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

interface FeedbackBody {
  question?: string;
  reply?: string;
  rating?: string;
  visitorId?: string;
}

export async function POST(request: Request) {
  const webhookUrl = process.env.GSHEET_WEBHOOK_URL;

  let body: FeedbackBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rating = body.rating === "up" || body.rating === "down" ? body.rating : null;
  if (!rating) {
    return NextResponse.json({ error: "rating must be 'up' or 'down'." }, { status: 400 });
  }

  const h = request.headers;
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim();

  const entry = {
    type: "ai_feedback",
    timestamp: new Date().toISOString(),
    rating,
    question: clean(body.question, MAX_TEXT),
    reply: clean(body.reply, MAX_TEXT),
    visitorId: clean(body.visitorId, MAX_FIELD),
    country: clean(h.get("x-vercel-ip-country"), MAX_FIELD),
    userAgent: clean(h.get("user-agent"), MAX_FIELD),
    ip: clean(ip, MAX_FIELD),
    token: process.env.GSHEET_TOKEN ?? "",
  };

  if (!webhookUrl) {
    return NextResponse.json({ ok: true, logged: false });
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
      redirect: "follow",
    });

    if (!res.ok) {
      console.error("[Jorata AI feedback] Sheet webhook error:", res.status);
      return NextResponse.json({ ok: true, logged: false });
    }

    return NextResponse.json({ ok: true, logged: true });
  } catch (error) {
    console.error("[Jorata AI feedback] Forward failed:", error);
    return NextResponse.json({ ok: true, logged: false });
  }
}

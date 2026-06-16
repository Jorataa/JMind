import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// JMind visitor log — server-side bridge to a Google Sheet.
//
// The browser POSTs a small "someone is using the app" entry here; this route
// enriches it (geo/IP/user-agent are only trustworthy on the server) and
// forwards it to a Google Apps Script Web App, which appends one row to the
// owner's sheet. See SETUP-VISITOR-LOG.md for the one-time setup.
//
// WHY a server route (not a direct browser → Apps Script call):
//   • The webhook URL + shared token stay secret (env vars, never shipped to JS).
//   • Geo/IP/User-Agent are read from real request headers, not spoofable input.
//   • If the sheet isn't configured yet, we no-op quietly instead of erroring.
// ─────────────────────────────────────────────────────────────────────────────

// Input caps — keep the payload (and the sheet) tidy and abuse-resistant.
const MAX_NAME = 80;
const MAX_FIELD = 300;

const clean = (value: unknown, max: number) =>
  String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

interface VisitorBody {
  event?: string;
  name?: string;
  visitorId?: string;
  path?: string;
  referrer?: string;
  timeZone?: string;
  language?: string;
}

export async function POST(request: Request) {
  const webhookUrl = process.env.GSHEET_WEBHOOK_URL;

  let body: VisitorBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Only two known events; anything else is recorded as "visit" to stay safe.
  const event = body.event === "joined" ? "joined" : "visit";
  const name = clean(body.name, MAX_NAME);

  // Vercel populates these geo/IP headers in production (empty in local dev).
  const h = request.headers;
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim();

  const entry = {
    timestamp: new Date().toISOString(),
    event,
    name,
    visitorId: clean(body.visitorId, MAX_FIELD),
    country: clean(h.get("x-vercel-ip-country"), MAX_FIELD),
    city: decodeURIComponent(clean(h.get("x-vercel-ip-city"), MAX_FIELD)),
    region: clean(h.get("x-vercel-ip-country-region"), MAX_FIELD),
    timeZone: clean(body.timeZone, MAX_FIELD),
    language: clean(body.language, MAX_FIELD),
    path: clean(body.path, MAX_FIELD),
    referrer: clean(body.referrer, MAX_FIELD),
    userAgent: clean(h.get("user-agent"), MAX_FIELD),
    ip: clean(ip, MAX_FIELD),
    // Shared secret so only this app can write to the sheet (optional).
    token: process.env.GSHEET_TOKEN ?? "",
  };

  // Not configured yet? Accept the request but skip forwarding, so the name
  // gate keeps working before the sheet is wired up.
  if (!webhookUrl) {
    console.warn("[JMind visitor] GSHEET_WEBHOOK_URL not set — skipping log.");
    return NextResponse.json({ ok: true, logged: false });
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
      redirect: "follow", // Apps Script 302-redirects to its content host.
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[JMind visitor] Sheet webhook error:", res.status, detail);
      // Don't surface infra errors to the visitor — logging is non-critical.
      return NextResponse.json({ ok: true, logged: false });
    }

    return NextResponse.json({ ok: true, logged: true });
  } catch (error) {
    console.error("[JMind visitor] Forward failed:", error);
    return NextResponse.json({ ok: true, logged: false });
  }
}

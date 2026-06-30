import { NextResponse } from "next/server";
import { applyRateLimit, rejectOversizedBody } from "@/lib/rate-limit";

// This route writes to the owner's Google Sheet; throttle to stop row-spam abuse.
const VISITOR_RATE_LIMIT = { limit: 30, windowMs: 60_000 };
const MAX_BODY_BYTES = 16 * 1024;

// ─────────────────────────────────────────────────────────────────────────────
// Jorata visitor log — server-side bridge to a Google Sheet.
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

// Google Sheets evaluates any cell that starts with = + - @ (or a control char)
// as a formula. Since these values land verbatim in the owner's sheet, prefix a
// single quote so they're stored as inert text — defeats CSV/formula injection
// (e.g. =IMPORTXML(...) exfil). See SECURITY_AUDIT.md finding 2.
const sanitizeCell = (value: string): string =>
  /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;

// clean + neutralize a formula trigger in one step, for user-controlled fields.
const cleanCell = (value: unknown, max: number): string =>
  sanitizeCell(clean(value, max));

// decodeURIComponent throws URIError on a malformed % sequence; never let an
// attacker-influenced header 500 the route.
const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

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
  const tooBig = rejectOversizedBody(request, MAX_BODY_BYTES);
  if (tooBig) return tooBig;

  const limited = applyRateLimit(request, VISITOR_RATE_LIMIT);
  if (limited) return limited;

  const webhookUrl = process.env.GSHEET_WEBHOOK_URL;

  let body: VisitorBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Only two known events; anything else is recorded as "visit" to stay safe.
  const event = body.event === "joined" ? "joined" : "visit";
  const name = cleanCell(body.name, MAX_NAME);

  // Vercel populates these geo/IP headers in production (empty in local dev).
  const h = request.headers;
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim();

  const entry = {
    timestamp: new Date().toISOString(),
    event,
    name,
    // User-controlled fields → cleanCell neutralizes spreadsheet formula triggers.
    visitorId: cleanCell(body.visitorId, MAX_FIELD),
    country: cleanCell(h.get("x-vercel-ip-country"), MAX_FIELD),
    city: cleanCell(safeDecode(clean(h.get("x-vercel-ip-city"), MAX_FIELD)), MAX_FIELD),
    region: cleanCell(h.get("x-vercel-ip-country-region"), MAX_FIELD),
    timeZone: cleanCell(body.timeZone, MAX_FIELD),
    language: cleanCell(body.language, MAX_FIELD),
    path: cleanCell(body.path, MAX_FIELD),
    referrer: cleanCell(body.referrer, MAX_FIELD),
    userAgent: cleanCell(h.get("user-agent"), MAX_FIELD),
    ip: cleanCell(ip, MAX_FIELD),
    // Shared secret so only this app can write to the sheet (optional).
    token: process.env.GSHEET_TOKEN ?? "",
  };

  // Not configured yet? Accept the request but skip forwarding, so the name
  // gate keeps working before the sheet is wired up.
  if (!webhookUrl) {
    console.warn("[Jorata visitor] GSHEET_WEBHOOK_URL not set — skipping log.");
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
      console.error("[Jorata visitor] Sheet webhook error:", res.status, detail);
      // Don't surface infra errors to the visitor — logging is non-critical.
      return NextResponse.json({ ok: true, logged: false });
    }

    return NextResponse.json({ ok: true, logged: true });
  } catch (error) {
    console.error("[Jorata visitor] Forward failed:", error);
    return NextResponse.json({ ok: true, logged: false });
  }
}

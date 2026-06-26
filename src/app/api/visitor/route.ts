import { NextResponse } from "next/server";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

// 5 visitor-log events per IP per minute: enough for legitimate page navigation,
// too low to be useful for flooding the Google Sheet with fake rows.
const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

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

/**
 * Decode a percent-encoded header value safely. `decodeURIComponent` throws a
 * URIError on malformed sequences (e.g. `%ZZ`); swallow that so a bad header
 * never turns into an unhandled 500.
 */
const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value; // return the raw value rather than crashing
  }
};

/**
 * Neutralise Google Sheets formula injection. Values that start with =, +, -,
 * or @ are interpreted as formulas when pasted/appended to a sheet. Prepend a
 * tab so Sheets treats the cell as plain text instead.
 */
const sanitizeForSheet = (value: string): string =>
  /^[=+\-@]/.test(value) ? `\t${value}` : value;

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
  const { success } = limiter.check(getClientIp(request));
  if (!success) {
    // Silently succeed from the client's perspective — analytics is non-critical
    // and we don't want to surface rate-limit errors in the UI.
    return NextResponse.json({ ok: true, logged: false });
  }

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
    // Sanitize all user-supplied / geo fields against Google Sheets formula injection.
    name: sanitizeForSheet(name),
    visitorId: sanitizeForSheet(clean(body.visitorId, MAX_FIELD)),
    country: sanitizeForSheet(clean(h.get("x-vercel-ip-country"), MAX_FIELD)),
    // Vercel percent-encodes city names with non-ASCII chars; decode safely.
    city: sanitizeForSheet(safeDecode(clean(h.get("x-vercel-ip-city"), MAX_FIELD))),
    region: sanitizeForSheet(clean(h.get("x-vercel-ip-country-region"), MAX_FIELD)),
    timeZone: sanitizeForSheet(clean(body.timeZone, MAX_FIELD)),
    language: sanitizeForSheet(clean(body.language, MAX_FIELD)),
    path: sanitizeForSheet(clean(body.path, MAX_FIELD)),
    referrer: sanitizeForSheet(clean(body.referrer, MAX_FIELD)),
    userAgent: sanitizeForSheet(clean(h.get("user-agent"), MAX_FIELD)),
    ip: sanitizeForSheet(clean(ip, MAX_FIELD)),
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

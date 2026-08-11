// ─────────────────────────────────────────────────────────────────────────────
// Visitor logging (client side).
//
// Fire-and-forget pings to our own /api/visitor route, which appends a row to
// the owner's Google Sheet. Two event types:
//   • "joined" — the visitor just entered their name in the welcome gate.
//   • "visit"  — a returning visitor opened the app (logged once per tab session).
//
// Design rules:
//   • Never block or break the UI. Every call swallows its own errors.
//   • The name never reaches Gemini/anyone else — only our route + the sheet.
//   • A stable random visitor id (localStorage) lets the owner tell distinct
//     devices apart even when two people pick the same name.
// ─────────────────────────────────────────────────────────────────────────────

const VISITOR_ID_KEY = "jmind:visitor-id";
const SESSION_LOGGED_KEY = "jmind:visit-logged";

export type VisitorEvent = "joined" | "visit";

/** Get (or lazily create) a stable per-device id. Safe to call on the client. */
export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    // Private mode / storage disabled — fall back to an ephemeral id.
    return "anonymous";
  }
}

/**
 * Send one entry to the sheet. Fully best-effort: returns immediately and never
 * throws. `keepalive` lets the request survive a navigation/refresh.
 */
export function logVisitor(event: VisitorEvent, name: string): void {
  if (typeof window === "undefined") return;

  try {
    const rawConsent = localStorage.getItem("jmind:cookie-consent");
    if (rawConsent) {
      const parsed = JSON.parse(rawConsent);
      if (parsed?.state?.hasResponded && parsed?.state?.analytics === false) {
        return; // User opted out of analytics/telemetry
      }
    }
  } catch {
    // If storage reading fails, default behavior continues
  }

  const payload = {
    event,
    name: name.trim().slice(0, 80),
    visitorId: getVisitorId(),
    // The page they landed on + how they got here — handy context in the sheet.
    path: window.location.pathname,
    referrer: document.referrer || "",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    language: navigator.language || "",
  };

  try {
    void fetch("/api/visitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      /* network blip — analytics is non-critical, ignore */
    });
  } catch {
    /* fetch unavailable — ignore */
  }
}

/**
 * Log a returning visitor exactly once per browser tab session. Called on app
 * load for already-onboarded users so we capture entry sessions without writing
 * a row on every page navigation.
 */
export function logVisitOncePerSession(name: string): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(SESSION_LOGGED_KEY)) return;
    sessionStorage.setItem(SESSION_LOGGED_KEY, "1");
  } catch {
    // If sessionStorage is unavailable we'd risk logging on every load, so bail.
    return;
  }
  logVisitor("visit", name);
}

/**
 * Mark this session as already logged. Called right after "joined" so the
 * once-per-session "visit" ping doesn't fire a duplicate row on the same load.
 */
export function markSessionLogged(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_LOGGED_KEY, "1");
  } catch {
    /* ignore */
  }
}

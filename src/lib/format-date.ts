export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/**
 * Long, human date — e.g. "Monday, June 8".
 *
 * Like every Intl call this renders in the *runtime's* timezone, so it must
 * only ever run on the client (the server is UTC). Callers that show "today"
 * are responsible for gating on hydration; see Topbar / useDailyWisdom.
 */
export function formatFullDate(date: string | Date = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(d);
}

/**
 * The user's local calendar day as "YYYY-MM-DD".
 *
 * Built from local date parts on purpose: `toISOString()` is always UTC, so it
 * rolls the day over at UTC midnight (early morning for the user) — keying
 * "today's" data off that silently misfiles it by a day. This does not.
 */
export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date instanceof Date ? date : new Date(NaN);
  // Guard against missing or malformed timestamps from older/corrupted storage —
  // a bad value here would otherwise throw and take the whole view down.
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return formatDate(d);
}

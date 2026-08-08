import type { SourceType } from "@/stores/use-knowledge-store";

/** Whole-input URL test — used to route captured links toward Knowledge. */
export const looksLikeUrl = (text: string): boolean =>
  /^(https?:\/\/|www\.)\S+$/i.test(text.trim());

export function inferSourceType(input: string, isFile = false): SourceType {
  if (isFile || /\.pdf($|\?)/i.test(input)) return "pdf";
  if (/youtube\.com|youtu\.be/i.test(input)) return "yt";
  return "web";
}

/** "https://ai.example.com/paper" → "ai.example.com — paper" (best effort). */
export function titleFromUrl(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const tail = decodeURIComponent(
      u.pathname.split("/").filter(Boolean).pop() ?? ""
    ).replace(/[-_+]/g, " ");
    return tail ? `${u.hostname} — ${tail}` : u.hostname;
  } catch {
    return url;
  }
}

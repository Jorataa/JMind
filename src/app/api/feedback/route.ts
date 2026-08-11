import { NextResponse } from "next/server";
import { applyRateLimit, rejectOversizedBody } from "@/lib/rate-limit";
import { sendFeedbackEmail } from "@/lib/feedback-email";

// Rate limit: maximum 10 feedback submissions per minute per IP to stop spam floods
const FEEDBACK_RATE_LIMIT = { limit: 10, windowMs: 60_000 };
const MAX_BODY_BYTES = 16 * 1024;

const ALLOWED_CATEGORIES = new Set([
  "Idea",
  "Bug",
  "Improvement",
  "Something I like",
  "Something confusing",
  "Other",
]);

/**
 * Cleans single-line input strings (category, path, browser, name) to prevent header/newline injection.
 */
const cleanSingleLine = (value: unknown, max: number): string =>
  String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

/**
 * Cleans multiline user message while preserving readable line breaks.
 */
const cleanMultiline = (value: unknown, max: number): string =>
  String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .slice(0, max);

interface FeedbackBody {
  category?: string;
  message?: string;
  userName?: string;
  context?: {
    path?: string;
    browser?: string;
    screenSize?: string;
  };
}

export async function POST(request: Request) {
  const tooBig = rejectOversizedBody(request, MAX_BODY_BYTES);
  if (tooBig) return tooBig;

  const limited = applyRateLimit(request, FEEDBACK_RATE_LIMIT);
  if (limited) return limited;

  let body: FeedbackBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const rawMessage = cleanMultiline(body.message, 1000);
  if (!rawMessage) {
    return NextResponse.json(
      { error: "Feedback message cannot be empty." },
      { status: 400 }
    );
  }

  const feedbackId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const rawCategory = cleanSingleLine(body.category || "Other", 50);
  const category = ALLOWED_CATEGORIES.has(rawCategory) ? rawCategory : "Other";

  const userName = cleanSingleLine(body.userName || "Anonymous", 80);
  const path = cleanSingleLine(body.context?.path || "", 200);
  const browser = cleanSingleLine(body.context?.browser || "", 200);
  const screenSize = cleanSingleLine(body.context?.screenSize || "", 50);

  const payload = {
    id: feedbackId,
    timestamp,
    category,
    message: rawMessage,
    userName,
    context: {
      ...(path ? { path } : {}),
      ...(browser ? { browser } : {}),
      ...(screenSize ? { screenSize } : {}),
    },
  };

  // Dispatch email notification via server-side dispatcher
  const result = await sendFeedbackEmail(payload);

  if (!result.success) {
    console.error(`[Jorata Feedback API Error] ID: ${feedbackId} | Provider: ${result.provider} | Error: ${result.error}`);
    return NextResponse.json(
      { error: "Couldn't send your feedback. Please try again." },
      { status: 500 }
    );
  }

  // Return success response to frontend (NEVER expose internal email or secret credentials)
  return NextResponse.json({
    ok: true,
    id: feedbackId,
    message: "Feedback sent successfully.",
  });
}


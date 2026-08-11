import "server-only";
import { Resend } from "resend";

export interface FeedbackEmailPayload {
  id: string;
  category: string;
  message: string;
  userName: string;
  timestamp: string;
  context?: {
    path?: string;
    browser?: string;
    screenSize?: string;
  };
}

export interface FeedbackEmailResult {
  success: boolean;
  provider: string;
  error?: string;
}

/**
 * Escapes special HTML characters to prevent XSS / HTML injection in generated emails.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Builds standard plain-text body for feedback notification.
 */
function buildTextBody(payload: FeedbackEmailPayload): string {
  const parts: string[] = [
    "Jorata Feedback",
    "",
    "Category:",
    payload.category,
    "",
    "Message:",
    payload.message,
  ];

  if (payload.context && (payload.context.path || payload.context.browser || payload.context.screenSize)) {
    const contextLines: string[] = [];
    if (payload.context.path) contextLines.push(`Page: ${payload.context.path}`);
    if (payload.context.browser) contextLines.push(`Browser: ${payload.context.browser}`);
    if (payload.context.screenSize) contextLines.push(`Screen: ${payload.context.screenSize}`);
    
    parts.push("", "Context:", contextLines.join("\n"));
  }

  parts.push("", "Submitted:", payload.timestamp);

  return parts.join("\n");
}

/**
 * Builds clean, escaped HTML body for feedback notification.
 */
function buildHtmlBody(payload: FeedbackEmailPayload): string {
  const safeCategory = escapeHtml(payload.category);
  const safeMessage = escapeHtml(payload.message).replace(/\n/g, "<br/>");
  const safeTimestamp = escapeHtml(payload.timestamp);

  let contextHtml = "";
  if (payload.context && (payload.context.path || payload.context.browser || payload.context.screenSize)) {
    const lines: string[] = [];
    if (payload.context.path) lines.push(`<li><strong>Page:</strong> ${escapeHtml(payload.context.path)}</li>`);
    if (payload.context.browser) lines.push(`<li><strong>Browser:</strong> ${escapeHtml(payload.context.browser)}</li>`);
    if (payload.context.screenSize) lines.push(`<li><strong>Screen:</strong> ${escapeHtml(payload.context.screenSize)}</li>`);
    
    contextHtml = `
      <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #eaeaea;">
        <p style="font-weight: 600; margin: 0 0 6px 0; color: #555;">Context:</p>
        <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 13px;">
          ${lines.join("")}
        </ul>
      </div>
    `;
  }

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #111; line-height: 1.5;">
      <h2 style="margin-top: 0; font-size: 20px; font-weight: 700; color: #0f172a;">Jorata Feedback</h2>
      
      <div style="margin-bottom: 16px;">
        <span style="display: inline-block; background-color: #f1f5f9; color: #334155; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
          Category: ${safeCategory}
        </span>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <p style="font-weight: 600; margin: 0 0 6px 0; color: #475569; font-size: 12px; text-transform: uppercase;">Message:</p>
        <div style="font-size: 14px; color: #1e293b; white-space: pre-wrap;">${safeMessage}</div>
      </div>

      ${contextHtml}

      <div style="margin-top: 20px; font-size: 12px; color: #94a3b8;">
        <strong>Submitted:</strong> ${safeTimestamp}
      </div>
    </div>
  `;
}

/**
 * Server-only feedback email dispatcher using official Resend SDK.
 * 
 * Routing:
 *   • To: process.env.FEEDBACK_PUBLIC_EMAIL
 *   • Bcc: process.env.FEEDBACK_INTERNAL_EMAIL
 * 
 * SECURITY: This module is marked 'server-only'. Secret API keys and private email addresses
 * are NEVER sent to or accessible from client browser bundles or API responses.
 */
export async function sendFeedbackEmail(payload: FeedbackEmailPayload): Promise<FeedbackEmailResult> {
  let resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (resendApiKey?.startsWith("re_re_")) {
    resendApiKey = resendApiKey.replace(/^re_re_/, "re_");
  }

  const publicRecipient = process.env.FEEDBACK_PUBLIC_EMAIL?.trim();
  const internalRecipient = process.env.FEEDBACK_INTERNAL_EMAIL?.trim();
  const fromEmail = process.env.FEEDBACK_FROM_EMAIL?.trim() || "Jorata Feedback <onboarding@resend.dev>";

  if (!resendApiKey) {
    console.error("[Jorata Feedback Email] RESEND_API_KEY environment variable is not configured.");
    return { success: false, provider: "resend", error: "RESEND_API_KEY missing" };
  }

  if (!publicRecipient) {
    console.error("[Jorata Feedback Email] FEEDBACK_PUBLIC_EMAIL environment variable is not configured.");
    return { success: false, provider: "resend", error: "FEEDBACK_PUBLIC_EMAIL missing" };
  }

  const subject = `[Jorata Feedback] ${payload.category}`;
  const textBody = buildTextBody(payload);
  const htmlBody = buildHtmlBody(payload);

  try {
    const resend = new Resend(resendApiKey);

    const bccList = internalRecipient ? [internalRecipient] : undefined;

    let { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [publicRecipient],
      ...(bccList ? { bcc: bccList } : {}),
      subject,
      text: textBody,
      html: htmlBody,
    });

    // If Resend rejected BCC because account is in testing sandbox mode (unverified domain)
    if (error && bccList && error.message?.includes("testing emails to your own email address")) {
      console.warn(`[Jorata Feedback Email] Resend testing mode restricted BCC to unverified recipient. Retrying without BCC...`);
      const retry = await resend.emails.send({
        from: fromEmail,
        to: [publicRecipient],
        subject,
        text: textBody,
        html: htmlBody,
      });
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error(`[Jorata Feedback Email] Resend API error (ID: ${payload.id}):`, error.message);
      return { success: false, provider: "resend", error: error.message };
    }

    console.log(`[Jorata Feedback Email] Delivered via Resend (ID: ${payload.id}, ResendID: ${data?.id ?? "unknown"})`);
    return { success: true, provider: "resend" };
  } catch (err) {
    console.error(`[Jorata Feedback Email] Exception during Resend dispatch (ID: ${payload.id}):`, err);
    return { success: false, provider: "resend", error: String(err) };
  }
}


import type { NextConfig } from "next";

// ─────────────────────────────────────────────────────────────────────────────
// Baseline HTTP security headers (see SECURITY_AUDIT.md finding 3).
//
// CSP note: Next.js + the inline theme bootstrap script in app/layout.tsx need
// 'unsafe-inline' for scripts today. This is a pragmatic baseline; tighten it to
// a nonce-based policy when feasible. 'unsafe-inline' for styles is required by
// Tailwind's injected styles. connect-src allows the Gemini and Supabase origins
// the app talks to.
// ─────────────────────────────────────────────────────────────────────────────
const ContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://generativelanguage.googleapis.com https://*.supabase.co wss://*.supabase.co",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
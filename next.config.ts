import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent the page from being framed (clickjacking).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Prevent MIME-type sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referrer information: full URL only on same-origin, just origin on cross-origin.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Enforce HTTPS for 1 year (preload-ready). Only effective in production.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Restrict browser feature APIs to what the app actually needs.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Content-Security-Policy.
  // 'unsafe-inline' for style-src is required by Tailwind's runtime; the script-src
  // 'unsafe-inline' budget covers the tiny theme-flash inline script in layout.tsx.
  // Tighten script-src to remove 'unsafe-inline' once the inline theme script is
  // moved to a nonce-stamped or hash-pinned script block.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Inline scripts (theme flash) + nonce placeholder for Next.js streaming.
      "script-src 'self' 'unsafe-inline'",
      // Tailwind v4 injects styles at runtime.
      "style-src 'self' 'unsafe-inline'",
      // Next/font self-hosts Google Fonts — no external font fetch needed.
      "font-src 'self' data:",
      // Images: self, data URIs (export preview), and blob: (PNG export).
      "img-src 'self' data: blob:",
      // Supabase realtime + REST, Gemini API.
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to every route.
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

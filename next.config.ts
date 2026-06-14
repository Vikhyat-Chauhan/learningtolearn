import type { NextConfig } from "next";

// Mirrors Hearth's conservative security headers, trimmed to what a fully
// static, client-side flashcard deck needs (no Supabase/external connect-src).
// 'unsafe-inline' is required by Next.js's inline runtime bootstrap.
const csp = [
  "default-src 'self'",
  // va.vercel-scripts.com serves the Vercel Web Analytics script.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://va.vercel-scripts.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  // This app sits beside other projects with their own lockfiles; pin the trace
  // root to this directory so Next doesn't warn about additional lockfiles.
  outputFileTracingRoot: __dirname,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://*.supabase.co";
const supabaseWs = supabase.replace(/^https/, "wss");
const dev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy (Stage 10). Scripts allow 'unsafe-inline' because the App Router
 * injects inline bootstrap scripts (no nonce pipeline in this prototype); everything else is tight.
 * Daily.co Prebuilt runs in an iframe; Supabase for storage and Realtime.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabase} https://lh3.googleusercontent.com`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabase} ${supabaseWs}${dev ? " ws:" : ""}`,
  "media-src 'self' blob: " + supabase,
  "frame-src https://*.daily.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
  "object-src 'none'",
  ...(dev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Mic for "Speak to fill" and voice notes; camera/mic delegated to Daily for calls.
  { key: "Permissions-Policy", value: 'camera=(self "https://*.daily.co"), microphone=(self "https://*.daily.co"), geolocation=(), payment=()' },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  // Separate build dirs let a dev server and a production server run side by side (QA).
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  reactStrictMode: true,
  poweredByHeader: false,
  // Put metadata in <head> for every client (Lighthouse/SEO), not streamed into <body>.
  htmlLimitedBots: /.*/,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Long cache for immutable sample art.
      { source: "/sample/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default withNextIntl(nextConfig);

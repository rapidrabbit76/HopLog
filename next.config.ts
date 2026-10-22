import type { NextConfig } from "next";

// Hosts that post images and thumbnails may load from. Posts brought in with `import:velog` keep pointing at
// Velog's CDNs; GitHub "raw" links redirect to raw.githubusercontent.com, and CSP checks the redirect target too.
// Used for both the CSP img-src and next/image (post thumbnails), so add a host here once.
const remoteImageHosts = [
  "images.velog.io",
  "velog.velcdn.com",
  "images.pexels.com",
  "github.com",
  "raw.githubusercontent.com",
];

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://giscus.app",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  `img-src 'self' data: blob: https://www.facebook.com ${remoteImageHosts.map((host) => `https://${host}`).join(" ")}`,
  "connect-src 'self' https://www.google-analytics.com https://*.sentry.io https://*.ingest.sentry.io https://connect.facebook.net",
  "frame-src https://giscus.app",
].join("; ");

const tracedRuntimeContentPaths = [
  "./content/posts/**/*",
  "./content/images/**/*",
  "./content/themes/**/*",
  "./content/**/*.yml",
];

const nextConfig: NextConfig = {
  output: "standalone",
  compress: false, // Cloudflare handles Brotli compression (better than gzip)
  outputFileTracingIncludes: {
    "/*": tracedRuntimeContentPaths,
  },
  images: {
    remotePatterns: remoteImageHosts.map((hostname) => ({ protocol: "https", hostname })),
  },
  // Umami tracker, collect endpoint and replay/heatmap recorder on this origin, proxied server-side (src/lib/umami.ts)
  async rewrites() {
    return [
      { source: "/_u/script.js", destination: "/api/umami/script" },
      { source: "/_u/api/send", destination: "/api/umami/send" },
      { source: "/_u/recorder.js", destination: "/api/umami/recorder" },
      { source: "/_u/api/record", destination: "/api/umami/record" },
      { source: "/_u/api/websites/:websiteId/recorder", destination: "/api/umami/recorder-config/:websiteId" },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
        ],
      },
    ];
  },
};

export default nextConfig;

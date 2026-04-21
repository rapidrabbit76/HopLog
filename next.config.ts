import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://giscus.app",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://www.facebook.com",
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
    remotePatterns: [],
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

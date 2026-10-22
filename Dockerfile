# ── Stage 1: Dependencies (Bun — 2s install) ────────────────────────
FROM oven/bun:1-alpine AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# ── Stage 2: Build (Node.js — webpack needs Node internals) ─────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN cp content/profile.example.yml content/profile.yml

ENV NEXT_TELEMETRY_DISABLED=1
# Extra origins allowed to frame the blog (CSP frame-ancestors), see next.config.ts
ARG CSP_FRAME_ANCESTORS=""
ENV CSP_FRAME_ANCESTORS=$CSP_FRAME_ANCESTORS

RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# ── Stage 3: Production runner (Bun — fast runtime) ─────────────────
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache su-exec && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/content ./content-seed
COPY --from=builder /app/messages ./messages
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["bun", "server.js"]

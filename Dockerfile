FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-only placeholders prevent environment validation from depending on
# production credentials. Runtime secrets are injected by Cloud Run.
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/omnipsyche?schema=public"
ENV AUTH_SECRET="build-only-secret"
ENV NEXTAUTH_SECRET="build-only-secret"
ENV NEXTAUTH_URL="http://localhost:8080"
ENV AUTH_URL="http://localhost:8080"
ENV GEMINI_API_KEY="build-only-key"
ENV DEVIL_AI_API_KEY="build-only-key"

RUN npm run prisma:generate
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]

FROM base AS migrator
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY prisma ./prisma
CMD ["./node_modules/.bin/prisma", "migrate", "deploy"]

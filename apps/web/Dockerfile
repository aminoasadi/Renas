# syntax=docker/dockerfile:1
# Multi-stage production build for the public Next.js site.
# Run docker build from the MONOREPO ROOT with:
#   docker build -f apps/web/Dockerfile -t renas-web .

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* .npmrc* ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/validation/package.json packages/validation/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /repo/node_modules /repo/node_modules
COPY --from=deps /repo/packages /repo/packages
COPY --from=deps /repo/apps/web/node_modules /repo/apps/web/node_modules
COPY . .
RUN pnpm --filter @renas/shared --filter @renas/validation build
ARG API_URL
ARG WEB_URL
ARG PREVIEW_SECRET
ARG REVALIDATE_SECRET
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GA_ID
ARG NEXT_PUBLIC_CLARITY_ID
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV API_URL=$API_URL WEB_URL=$WEB_URL PREVIEW_SECRET=$PREVIEW_SECRET REVALIDATE_SECRET=$REVALIDATE_SECRET \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID \
    NEXT_PUBLIC_CLARITY_ID=$NEXT_PUBLIC_CLARITY_ID NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
RUN pnpm --filter @renas/web build

FROM node:20-alpine AS runtime
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /repo

COPY --from=build /repo/pnpm-workspace.yaml /repo/package.json /repo/pnpm-lock.yaml* ./
COPY --from=build /repo/packages/shared packages/shared
COPY --from=build /repo/packages/validation packages/validation
COPY --from=build /repo/apps/web/package.json apps/web/package.json
COPY --from=build /repo/apps/web/.next apps/web/.next
COPY --from=build /repo/apps/web/public apps/web/public
COPY --from=build /repo/apps/web/next.config.mjs apps/web/next.config.mjs

RUN pnpm install --frozen-lockfile --prod

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["pnpm", "--filter", "@renas/web", "start"]

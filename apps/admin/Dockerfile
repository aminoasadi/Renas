# syntax=docker/dockerfile:1
# Multi-stage production build for the CMS admin.
# Run docker build from the MONOREPO ROOT with:
#   docker build -f apps/admin/Dockerfile -t renas-admin .

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* .npmrc* ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/validation/package.json packages/validation/package.json
COPY apps/admin/package.json apps/admin/package.json
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /repo/node_modules /repo/node_modules
COPY --from=deps /repo/packages /repo/packages
COPY --from=deps /repo/apps/admin/node_modules /repo/apps/admin/node_modules
COPY . .
RUN pnpm --filter @renas/shared --filter @renas/validation build
RUN pnpm --filter @renas/admin build

FROM node:20-alpine AS runtime
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /repo

COPY --from=build /repo/pnpm-workspace.yaml /repo/package.json /repo/pnpm-lock.yaml* ./
COPY --from=build /repo/packages/shared packages/shared
COPY --from=build /repo/packages/validation packages/validation
COPY --from=build /repo/apps/admin/package.json apps/admin/package.json
COPY --from=build /repo/apps/admin/.next apps/admin/.next
COPY --from=build /repo/apps/admin/public apps/admin/public
COPY --from=build /repo/apps/admin/next.config.mjs apps/admin/next.config.mjs

RUN pnpm install --frozen-lockfile --prod

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["pnpm", "--filter", "@renas/admin", "start"]

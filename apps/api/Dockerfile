# syntax=docker/dockerfile:1
# Multi-stage production build for the NestJS API.
# Run docker build from the MONOREPO ROOT with:
#   docker build -f apps/api/Dockerfile -t renas-api .

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

# ---- deps: install the full workspace's dependencies once, cached ----
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* .npmrc* ./
COPY packages/database/package.json packages/database/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/validation/package.json packages/validation/package.json
COPY packages/config/package.json packages/config/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile

# ---- build: compile workspace packages, generate Prisma client, build Nest ----
FROM base AS build
COPY --from=deps /repo/node_modules /repo/node_modules
COPY --from=deps /repo/packages /repo/packages
COPY --from=deps /repo/apps/api/node_modules /repo/apps/api/node_modules
COPY . .
RUN pnpm --filter @renas/database exec prisma generate
RUN pnpm --filter @renas/config --filter @renas/shared --filter @renas/validation --filter @renas/database build
RUN pnpm --filter @renas/api build

# ---- runtime: only compiled output + production deps, no build toolchain ----
FROM node:20-alpine AS runtime
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /repo

COPY --from=build /repo/pnpm-workspace.yaml /repo/package.json /repo/pnpm-lock.yaml* ./
COPY --from=build /repo/packages/database/package.json packages/database/package.json
COPY --from=build /repo/packages/database/dist packages/database/dist
COPY --from=build /repo/packages/database/prisma packages/database/prisma
COPY --from=build /repo/packages/shared/package.json packages/shared/package.json
COPY --from=build /repo/packages/shared/dist packages/shared/dist
COPY --from=build /repo/packages/validation/package.json packages/validation/package.json
COPY --from=build /repo/packages/validation/dist packages/validation/dist
COPY --from=build /repo/packages/config/package.json packages/config/package.json
COPY --from=build /repo/packages/config/dist packages/config/dist
COPY --from=build /repo/apps/api/package.json apps/api/package.json
COPY --from=build /repo/apps/api/dist apps/api/dist

RUN pnpm install --frozen-lockfile --prod
RUN pnpm --filter @renas/database exec prisma generate

EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3002/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/api/dist/main.js"]

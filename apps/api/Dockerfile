# ---- base ----
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/database/package.json packages/database/
COPY packages/shared/package.json packages/shared/
COPY packages/config/package.json packages/config/
RUN pnpm install --frozen-lockfile

# ---- dev ----
FROM deps AS dev
COPY . .
RUN pnpm --filter @scholarship/database db:generate
EXPOSE 4000
CMD ["pnpm", "--filter", "@scholarship/api", "dev"]

# ---- build ----
FROM deps AS build
COPY . .
RUN pnpm --filter @scholarship/database db:generate
RUN pnpm --filter @scholarship/api build

# ---- prod ----
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/node_modules ./node_modules
EXPOSE 4000
CMD ["node", "dist/main.js"]

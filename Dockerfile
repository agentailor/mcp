# Multi-stage build for running the server locally or on any container host.
# (The hosted deployment on Render uses the native Node runtime, not this image.)
# TRANSPORT selects the entrypoint:
#   stdio (default) — local clients (Claude Desktop) via `docker run -i`
#   http            — self-host anywhere on PORT (default 3000)
ARG TRANSPORT=stdio

FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Drop dev dependencies from the installed tree (no second network install).
RUN pnpm prune --prod

# Production stage
FROM node:20-alpine AS production

ARG TRANSPORT
ENV TRANSPORT=${TRANSPORT}

WORKDIR /app

COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# HTTP transport listens here; ignored by stdio.
EXPOSE 3000

# Run the entrypoint chosen at build time.
CMD ["sh", "-c", "node dist/index.${TRANSPORT}.js"]

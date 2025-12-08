# Development Dockerfile for API
FROM node:lts-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy shared package source and build it
COPY packages/shared ./packages/shared
RUN pnpm --filter @applyr/shared build

# Copy API source (will be overridden by volume mount in dev)
COPY apps/api ./apps/api

# Expose port
EXPOSE 5677

# Start development server with hot reload
CMD ["pnpm", "--filter", "@applyr/api", "dev"]

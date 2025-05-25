FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy workspace package files first
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages/

# Copy dashboard package files
COPY examples/dashboard/package.json examples/dashboard/pnpm-lock.yaml* ./examples/dashboard/

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy dashboard application code
COPY examples/dashboard ./examples/dashboard/

# Build the svelte-langserve package first
RUN cd packages/svelte-langserve && pnpm build

# Set working directory to dashboard
WORKDIR /app/examples/dashboard

# Run paraglide compile, svelte-kit sync and build
RUN npx @inlang/paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide || echo "Paraglide compilation failed, continuing..." && pnpm run prepare && pnpm build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/langserve || exit 1

# Run the application
CMD ["node", "build"]
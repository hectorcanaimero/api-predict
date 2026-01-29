# ================================
# Stage 1: Builder
# ================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY nest-cli.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY src ./src

# Build the application
RUN npm run build

# Verify build output
RUN ls -la dist/ && test -f dist/main.js

# ================================
# Stage 2: Production
# ================================
FROM node:18-alpine AS production

# Add labels for container registry
LABEL org.opencontainers.image.source="https://github.com/hectorcanaimero/api-predict"
LABEL org.opencontainers.image.description="Emarsys CPF Recommendations Scraper API"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Install Playwright/Chromium dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Environment variables for Playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production
ENV PORT=3000

# Copy package files
COPY package*.json ./

# Install production dependencies only (new npm syntax)
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Verify the main.js exists
RUN ls -la dist/ && test -f dist/main.js

# Change ownership to non-root user
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/scraping/stats || exit 1

# Start the application
CMD ["node", "dist/main.js"]

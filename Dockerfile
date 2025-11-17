# Multi-stage build for Romance Platform
FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the romance platform
RUN npm run build:romance

# Production stage
FROM node:18-alpine as production

# Install production dependencies
RUN apk add --no-cache \n    imagemagick \n    ghostscript \n    cairo \n    pango \n    jpeg \n    giflib \n    librsvg

# Create app user
RUN addgroup -g 1001 -S romance && \\n    adduser -S romance -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=romance:romance /app/dist ./dist
COPY --from=builder --chown=romance:romance /app/node_modules ./node_modules
COPY --from=builder --chown=romance:romance /app/package*.json ./

# Create directories for romance assets
RUN mkdir -p /app/uploads /app/covers /app/exports /app/temp && \\n    chown -R romance:romance /app

# Switch to non-root user
USER romance

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\n  CMD node dist/healthcheck.js

# Set romance-specific environment variables
ENV NODE_ENV=production
ENV ROMANCE_FEATURES_ENABLED=true
ENV AI_ROMANCE_PERSONAS_ENABLED=true
ENV MARKETPLACE_ENABLED=true
ENV KDP_INTEGRATION_ENABLED=true

# Start the romance platform
CMD [\"node\", \"dist/server/index.js\"]
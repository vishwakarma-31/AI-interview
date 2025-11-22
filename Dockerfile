# Multi-stage Dockerfile for AI Interview Assistant

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

# Set working directory
WORKDIR /app

# Copy frontend package files
COPY package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source code
COPY . .

# Build frontend
RUN npm run build

# Stage 2: Build backend
FROM node:18-alpine AS backend-builder

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# Stage 3: Production image
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install curl and OpenSSL for health checks and SSL support
RUN apk add --no-cache curl openssl

# Copy backend dependencies from backend-builder stage
COPY --from=backend-builder /app/node_modules ./node_modules

# Copy backend source code
COPY --from=backend-builder /app/package*.json ./
COPY backend/. ./backend/

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /app/dist ./dist

# Create certificates directory
RUN mkdir -p ./certs

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Expose ports (will be configurable via environment variables)
EXPOSE $PORT
EXPOSE $SSL_PORT

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/health || exit 1

# Start the application
CMD ["node", "backend/server.js"]
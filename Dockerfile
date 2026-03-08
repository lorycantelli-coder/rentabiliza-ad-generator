# Multi-stage build for Node.js backend
# Stage 1: Dependencies
FROM node:18-alpine AS dependencies

WORKDIR /app

# Install dependencies only (for better layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Copy runtime dependencies from Stage 1
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code
COPY backend.js .
COPY ecosystem.config.js .
COPY package*.json ./

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Default to PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]

# Multi-stage build for production deployment
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm ci --only=production && npm cache clean --force
RUN cd server && npm ci --only=production && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules

# Build frontend
RUN npm run build

# Build backend
RUN cd server && npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/server/dist ./server/dist
COPY --from=builder --chown=nextjs:nodejs /app/server/package*.json ./server/
COPY --from=deps --chown=nextjs:nodejs /app/server/node_modules ./server/node_modules

USER nextjs

EXPOSE 10000

CMD ["node", "server/dist/index.js"]

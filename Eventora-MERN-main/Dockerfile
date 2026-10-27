# ==========================================
# Eventora Multi-Stage Production Dockerfile
# ==========================================

# 1. Build Client Frontend
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# 2. Production Server Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install server production dependencies
COPY server/package*.json ./server/
RUN npm install --prefix server --omit=dev --legacy-peer-deps

# Copy server code
COPY server/ ./server/

# Copy built frontend assets into client/dist for server static delivery
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 5000

CMD ["node", "server/server.js"]


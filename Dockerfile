# Multi-stage Dockerfile for Hisaab Kitaab (Cloud Run Compatible)
FROM node:24-slim AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy source code and configuration
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY index.html ./
COPY src ./src/
COPY scripts ./scripts/

# Generate Prisma client and build frontend and backend
RUN npx prisma generate
RUN npm run build:client
RUN npm run build:server

# Production runner image
FROM node:24-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV STORAGE_DIR=/app/data/uploads

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev

# Copy compiled assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/data ./data
COPY --from=builder /app/scripts ./scripts

# Ensure data and uploads directory exist
RUN mkdir -p /app/data/uploads /app/data/synthetic-fixtures

EXPOSE 8080

CMD ["node", "dist/server/app.js"]

# Etapa 1: compilar TypeScript y generar Prisma Client (requiere devDependencies)
FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: solo dependencias de producción + artefactos compilados
FROM node:22-slim

WORKDIR /app

ENV NODE_ENV=production

# curl: healthcheck. Librerías: Chromium descargado por Puppeteer en Linux
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libcairo2 libcups2 libdbus-1-3 libdrm2 libgbm1 libglib2.0-0 libnspr4 libnss3 libpango-1.0-0 libx11-6 libxcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxkbcommon0 libxrandr2 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./src/generated

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Migraciones antes de arrancar (solo el servicio API debe ejecutar migrate en despliegue)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]

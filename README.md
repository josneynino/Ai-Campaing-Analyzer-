## AI Campaign Competitive Analyzer

Aplicación full‑stack para analizar campañas de marketing con IA, scraping (Puppeteer), cola asíncrona (BullMQ/Redis) y almacenamiento en SQLite/Prisma.

### ✅ Production Ready Features

- **Security**: Helmet.js, CORS configurado, rate limiting, validación de inputs
- **Performance**: Health checks, Nginx optimizado, Docker multi-stage
- **Monitoring**: Logging estructurado con Pino, health endpoints
- **Reliability**: Manejo robusto de errores, dependencias saludables

### Estructura

- **backend**: API REST en Node + TypeScript (Express, Prisma, BullMQ, Puppeteer).
- **frontend**: SPA en React + Vite.

### Variables de entorno críticas (backend)

Debes definir al menos:

- **DATABASE_URL**: URL de SQLite, por ejemplo `file:./prisma/production.db`.
- **JWT_SECRET**: cadena secreta larga (≥32 caracteres).
- **JWT_EXPIRES_IN**: duración del token JWT (por defecto `1d`).
- **GEMINI_API_KEY**: API key de Google Gemini (Google AI Studio).
- **REDIS_URL** (opcional): si no se define, usa `127.0.0.1:6379`.
- **FRONTEND_URL** (opcional): para CORS, por defecto `http://localhost:3000`.
- **LOG_LEVEL** (opcional): nivel de logging, por defecto `info`.
- **META_AD_LIBRARY_ACCESS_TOKEN / META_AD_LIBRARY_ENDPOINT** (opcionales).
- **GOOGLE_ADS_TRANSPARENCY_ENDPOINT** (opcional).

En desarrollo puedes crear un `.env` en `backend/` con estos valores. Usa `.env.example` como referencia.

### Arranque en desarrollo

1. **Redis** en marcha en `localhost:6379` (o configura `REDIS_URL` en `backend/.env`). Opciones: Docker, WSL, Memurai o Redis en la nube — ver [`GUIA_ANALISIS_LOCAL.md`](./GUIA_ANALISIS_LOCAL.md).

2. **Dependencias** (desde la raíz del repositorio):

   ```bash
   npm run install:all
   ```

3. **Variables**: copia `backend/.env.example` a `backend/.env` y define al menos `GEMINI_API_KEY`.

4. **Levantar API + worker + frontend en un solo comando** (desde la raíz):

   ```bash
   npm run dev
   ```

   Arranca el backend (puerto **4000**), el worker de análisis y Vite (suele ser **http://localhost:5173**).

   **Alternativa manual** (tres terminales): `npm run dev` en `backend/`, `npm run worker:analysis` en `backend/`, `npm run dev` en `frontend/`.

**Guía paso a paso** (Redis sin Docker, nube, CORS, troubleshooting): [`GUIA_ANALISIS_LOCAL.md`](./GUIA_ANALISIS_LOCAL.md).

### Build de producción sin Docker

- **Backend**:

  ```bash
  cd backend
  npm run build
  npm start
  ```

- **Frontend**:

  ```bash
  cd frontend
  npm run build
  npm run preview
  ```

### 🚀 Despliegue con Docker Compose (recomendado)

Este repositorio incluye:

- `backend/Dockerfile`: imagen de la API y worker (Node 22, build TypeScript, seguridad mejorada).
- `frontend/Dockerfile`: build de React y despliegue estático con Nginx optimizado.
- `docker-compose.yml`: orquesta `backend`, `worker`, `frontend` y `redis` con health checks.

1. Define las variables de entorno sensibles en tu entorno de despliegue:

   ```bash
   export JWT_SECRET=your-super-secret-jwt-key
   export GEMINI_API_KEY=your-gemini-api-key
   export FRONTEND_URL=https://yourdomain.com
   ```

2. Construye y arranca todo:

   ```bash
   docker compose up --build -d
   ```

3. Verifica salud de los servicios:

   ```bash
   curl http://localhost:4000/health  # Backend
   curl http://localhost:3000/health   # Frontend
   docker compose ps                  # Estado de todos los servicios
   ```

4. Servicios resultantes:

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000/api`
- **Redis**: `localhost:6379` (expuesto sólo para debugging/desarrollo).

El frontend usa `VITE_API_BASE_URL` (configurado en `docker-compose.yml` como `http://backend:4000/api`) para hablar con la API dentro de la red de Docker.

### 📋 Features de Producción

- **Security Headers**: Helmet.js con CSP configurada
- **Rate Limiting**: 100 req/15min en producción, 1000 en desarrollo
- **Health Checks**: Todos los servicios monitoreados
- **Logging**: Estructurado con Pino, sin datos sensibles
- **Error Handling**: Respuestas consistentes, sin stack traces en producción
- **CORS**: Configurado por entorno con orígenes restringidos
- **Nginx**: Compresión gzip, caché de assets, headers de seguridad

### 📖 Documentación Adicional

Ver `DEPLOYMENT.md` para guía completa de despliegue en producción y consideraciones de seguridad.
# Ai-Campaing-Analyzer-

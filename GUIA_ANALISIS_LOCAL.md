# Guía completa: proyecto en local (análisis funcionando)

Todo lo que necesitas para que **login, API, cola Redis, worker de IA y frontend** funcionen juntos.

---

## Orden recomendado (primera vez)

1. Instalar dependencias (raíz + backend + frontend).
2. Tener **Redis** accesible (elige una opción abajo).
3. Configurar **`backend/.env`** (mínimo `GEMINI_API_KEY` y base de datos).
4. Arrancar **API + worker + frontend** (una sola terminal con `npm run dev` en la raíz, o tres terminales).
5. Abrir el navegador en la URL de Vite (suele ser **http://localhost:5173**).

---

## 1. Instalar dependencias

En la **carpeta raíz** del proyecto:

```bash
npm run install:all
```

Equivale a:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

---

## 2. Redis (obligatorio para la cola BullMQ)

Sin Redis, el análisis **no se encola** o el worker **no conecta**. Elige **una** opción.

### A) Docker (rápido si tienes Docker Desktop)

```bash
docker run -d --name redis-local -p 6379:6379 redis:7-alpine
```

Comprueba: el puerto **6379** está libre y escuchando.

### B) Sin Docker — WSL2 (Ubuntu en Windows)

```bash
wsl
sudo apt update && sudo apt install -y redis-server
sudo service redis-server start
```

Redis queda en `127.0.0.1:6379`. No hace falta cambiar `REDIS_URL` en el backend.

### C) Sin Docker — Memurai (Windows nativo)

1. Descarga la edición **Developer** en [memurai.com](https://www.memurai.com/).
2. Instala; por defecto suele usar **6379**.
3. En `backend/.env` puedes dejar `REDIS_URL=redis://127.0.0.1:6379` o omitirlo.

### D) Sin instalar Redis en el PC — Redis en la nube

- [Upstash](https://upstash.com/) o [Redis Cloud](https://redis.io/cloud/) (plan gratuito o de prueba).
- Crea una base Redis y copia la URL que te den (a veces `rediss://` con TLS).

En **`backend/.env`**:

```env
REDIS_URL=rediss://default:TU_PASSWORD@TU_HOST:PUERTO
```

(Usa exactamente la URL del panel; reinicia API y worker tras guardar.)

---

## 3. Variables de entorno del backend

Copia el ejemplo y edita:

```bash
cd backend
copy .env.example .env
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

**Mínimo para desarrollo:**

| Variable | Valor típico |
|----------|----------------|
| `DATABASE_URL` | `file:./prisma/dev.db` |
| `GEMINI_API_KEY` | Obligatoria: clave de [Google AI Studio](https://aistudio.google.com) para el informe con IA |
| `JWT_SECRET` | ≥32 caracteres (en dev el backend puede usar un valor por defecto) |
| `REDIS_URL` | `redis://127.0.0.1:6379` o la URL de la nube |

**¿Pagas Gemini Plus en la app y aun así ves error de cuota (429)?**  
Eso es esperable: **Gemini Plus / Advanced** (chat en la app de Google) **no** incluye cuota para la **API de desarrolladores**. Esta app usa una clave de **[Google AI Studio](https://aistudio.google.com/apikey)** con límites aparte. Revisa el plan y uso de esa clave; si hace falta más volumen, consulta [precios de la API de Gemini](https://ai.google.dev/pricing) y facturación en Google Cloud (API Generative Language).

Si usas Vite en **5173**, puedes añadir en `backend/.env` para CORS:

```env
FRONTEND_URL=http://localhost:5173
```

---

## 4. Variables del frontend (opcional)

Por defecto apunta a `http://localhost:4000/api`. Si cambias el puerto del backend:

```bash
cd frontend
copy .env.example .env.local
```

Edita:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

Reinicia `npm run dev` del frontend tras cambiar `.env.local`.

---

## 5. Arrancar todo (API + worker + web)

**Opción recomendada — una sola terminal** (desde la **raíz** del repo, con Redis ya en marcha):

```bash
npm run dev
```

Esto levanta en paralelo:

- **API** backend en **http://localhost:4000**
- **Worker** de análisis (cola BullMQ)
- **Frontend** Vite (suele ser **http://localhost:5173**)

**Opción manual — tres terminales** (misma carpeta `backend` para las dos primeras):

| Terminal | Comando |
|----------|---------|
| 1 | `cd backend` → `npm run dev` |
| 2 | `cd backend` → `npm run worker:analysis` |
| 3 | `cd frontend` → `npm run dev` |

**Comprobaciones:**

- API: [http://localhost:4000/health](http://localhost:4000/health) → `status: ok`
- Web: abre la URL que muestre Vite en consola.

---

## 6. Uso en la aplicación

1. **Registro / login** con email y contraseña.
2. **Nuevo análisis**: por **URL** (landing pública) o **pegando texto** (mejor para redes sociales).
3. Espera el panel de progreso; si Redis/worker fallan, verás mensajes orientativos.

---

## 7. Problemas frecuentes

| Síntoma | Qué hacer |
|---------|-----------|
| `ERR_CONNECTION_REFUSED` en puerto 4000 | Arranca `npm run dev` en `backend` o usa `npm run dev` en la raíz. |
| Se queda “encolando” y no avanza | Redis no está activo o no es alcanzable. Arranca Redis o `REDIS_URL` correcta. |
| Error 503 “Redis no disponible” | Mismo: Redis no responde en el host/puerto configurado. |
| Job “pendiente” sin fin | Falta el **worker** (`npm run worker:analysis` o el script raíz `npm run dev`). |
| Error de IA / cuota (429) | La clave es de **AI Studio**, no la suscripción Gemini de la app. Revise límites de la clave y [precios API](https://ai.google.dev/pricing). |
| Scraping por URL falla | Usa **Pegar texto** con el copy del anuncio. |

---

## 8. Resumen en una frase

**Redis + `GEMINI_API_KEY` + API + worker + frontend** = análisis completo.

El comando **`npm run install:all`** y **`npm run dev`** en la raíz automatizan dependencias y los tres procesos (tras tener Redis y `.env` listos).

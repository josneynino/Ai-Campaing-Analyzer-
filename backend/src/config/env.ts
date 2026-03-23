import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
// Secret por defecto SOLO para desarrollo local. No usar en producción.
const DEV_JWT_SECRET_FALLBACK =
  "dev-local-jwt-secret-change-me-123456";

const envSchema = z.object({
  PORT: z.string().optional(),
  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET debe tener al menos 16 caracteres")
    .optional(),
  JWT_EXPIRES_IN: z.string().default("1d"),
  GEMINI_API_KEY: z.string().optional(),
  REDIS_URL: z.string().optional(),
  LOG_LEVEL: z.string().default("info"),
  META_AD_LIBRARY_ACCESS_TOKEN: z.string().optional(),
  META_AD_LIBRARY_ENDPOINT: z.string().optional(),
  GOOGLE_ADS_TRANSPARENCY_ENDPOINT: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Error en variables de entorno", parsed.error.flatten().fieldErrors);
  throw new Error("Variables de entorno inválidas");
}

const rawEnv = parsed.data;

// En producción exigimos los secretos; en desarrollo damos valores por defecto.
let jwtSecret: string;
if (isProduction) {
  if (!rawEnv.JWT_SECRET) {
    throw new Error("JWT_SECRET es obligatorio en producción");
  }
  if (!rawEnv.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY es obligatorio en producción");
  }
  jwtSecret = rawEnv.JWT_SECRET;
} else {
  jwtSecret = rawEnv.JWT_SECRET ?? DEV_JWT_SECRET_FALLBACK;
  // GEMINI_API_KEY puede quedar sin definir en dev; los endpoints que lo usen
  // fallarán con un mensaje claro en vez de romper el arranque.
}

export const env = {
  ...rawEnv,
  JWT_SECRET: jwtSecret,
};


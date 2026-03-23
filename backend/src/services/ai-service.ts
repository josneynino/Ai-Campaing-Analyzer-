import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import pino from "pino";
import { env } from "../config/env";

const logger = pino({ level: env.LOG_LEVEL ?? "info" });

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY_NO_CONFIG: defina GEMINI_API_KEY en backend/.env (Google AI Studio) y reinicie el worker.",
    );
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return aiClient;
}

const analysisSchema = z.object({
  summary: z.string(),
  clarityScore: z.number().int().min(1).max(10),
  persuasionScore: z.number().int().min(1).max(10),
  differentiationScore: z.number().int().min(1).max(10),
  ctaScore: z.number().int().min(1).max(10),
  conversionScore: z.number().int().min(1).max(10),
  recommendations: z.string(),
  optimizedVersion: z.string(),
});

const nicheSchema = z.object({
  niche: z.string(),
  keywords: z.array(z.string()).min(1),
});

export type AnalysisResult = z.infer<typeof analysisSchema>;

export type NicheDetectionResult = z.infer<typeof nicheSchema>;

/**
 * La suscripción «Gemini» en la app (Plus/Advanced/Google One) NO incluye cuota para la API de desarrolladores.
 * Esta app usa una API key de Google AI Studio — límites y facturación aparte.
 * @see https://ai.google.dev/gemini-api/docs/billing
 */
const QUOTA_ERROR_MESSAGE =
  "Cuota de la API de Gemini para desarrolladores (429 / límite diario o por minuto). " +
  "La suscripción Gemini Plus de la aplicación no aplica aquí: debe usar una clave de Google AI Studio " +
  "(aistudio.google.com/apikey) y revisar el plan y límites de esa clave. " +
  "Si necesita más uso, active facturación en Google Cloud para la API Generative Language.";

function isQuotaError(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? "");
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("exceeded")
  );
}

/** Extrae JSON del texto de respuesta (puede venir envuelto en ```json ... ```). */
function extractJson(text: string): string {
  const trimmed = text.trim();
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock?.[1]) {
    return codeBlock[1].trim();
  }
  return trimmed;
}

export async function detectNicheAndKeywords(
  text: string,
): Promise<NicheDetectionResult> {
  const systemPrompt =
    "Eres un analista de marketing. Dado el texto de una campaña, " +
    "identificas el nicho/industria y 3-7 palabras clave de segmentación.";

  const userPrompt = `
Texto de la campaña:
---
${text}
---

Devuelve SOLO un JSON con este formato:
{
  "niche": "nicho o industria principal en una frase corta",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}
`;

  let response;
  try {
    const ai = getAiClient();
    response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
      },
    });
  } catch (err) {
    if (isQuotaError(err)) {
      throw new Error(QUOTA_ERROR_MESSAGE, { cause: err });
    }
    throw err;
  }

  const rawContent = response.text ?? "";

  if (!rawContent.trim()) {
    throw new Error("EMPTY_RESPONSE");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(extractJson(rawContent));
  } catch (error) {
    logger.error({ error, rawContent }, "Error parseando JSON de nicho Gemini");
    throw new Error("INVALID_JSON", { cause: error });
  }

  const result = nicheSchema.safeParse(parsed);
  if (!result.success) {
    // eslint-disable-next-line no-console
    console.error("Respuesta de Gemini nicho no valida schema:", result.error.flatten());
    throw new Error("INVALID_SCHEMA", { cause: result.error });
  }

  return result.data;
}

export async function analyzeCampaignText(text: string): Promise<AnalysisResult> {
  const systemPrompt =
    "Eres un estratega senior de marketing digital y copywriting de respuesta directa. " +
    "Analizas campañas publicitarias y devuelves un JSON ESTRICTO con insights accionables. " +
    "El texto de entrada puede incluir, además del anuncio principal, una sección 'COMPETIDORES RELEVANTES' " +
    "con descripciones resumidas de anuncios competidores; úsala para comparar y posicionar mejor la campaña. " +
    "NO incluyas explicaciones fuera del JSON.";

  const userPrompt = `
Texto de la campaña a analizar:
---
${text}
---

Genera un análisis estructurado con este formato JSON (solo JSON válido, sin texto adicional):
{
  "summary": "resumen ejecutivo en 3-5 frases",
  "clarityScore": 1-10,
  "persuasionScore": 1-10,
  "differentiationScore": 1-10,
  "ctaScore": 1-10,
  "conversionScore": 1-10,
  "recommendations": "lista de recomendaciones concretas en texto plano (bullets separados por saltos de línea)",
  "optimizedVersion": "reescritura optimizada del anuncio manteniendo la promesa y el ángulo"
}
`;

  let response;
  try {
    const ai = getAiClient();
    response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });
  } catch (err) {
    if (isQuotaError(err)) {
      throw new Error(QUOTA_ERROR_MESSAGE, { cause: err });
    }
    throw err;
  }

  const rawContent = response.text ?? "";

  if (!rawContent.trim()) {
    throw new Error("EMPTY_RESPONSE");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(extractJson(rawContent));
  } catch (error) {
    logger.error({ error, rawContent }, "Error parseando JSON de Gemini");
    throw new Error("INVALID_JSON", { cause: error });
  }

  const result = analysisSchema.safeParse(parsed);
  if (!result.success) {
    // eslint-disable-next-line no-console
    console.error("Respuesta de Gemini no valida schema:", result.error.flatten());
    throw new Error("INVALID_SCHEMA", { cause: result.error });
  }

  return result.data;
}

export async function generateCounterCampaignText(competitorText: string, weaknesses: string): Promise<string> {
  const systemPrompt =
    "Eres un experto copywriter de respuesta directa. Tu objetivo es redactar un anuncio (copy) persuasivo " +
    "para nuestra marca, que se posicione como una alternativa superior al anuncio de la competencia, atacando " +
    "sutilmente las debilidades detectadas sin mencionarlos directamente. Solo devuelve el texto del anuncio.";

  const userPrompt = `Anuncio de la competencia:\n---\n${competitorText}\n---\n\nDebilidades/Áreas de mejora detectadas:\n---\n${weaknesses}\n---\n\nRedacta el nuevo copy:`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.8,
      },
    });
    
    if (!response.text?.trim()) {
      throw new Error("EMPTY_RESPONSE");
    }
    return response.text.trim();
  } catch (err) {
    if (isQuotaError(err)) {
      throw new Error(QUOTA_ERROR_MESSAGE, { cause: err });
    }
    throw err;
  }
}

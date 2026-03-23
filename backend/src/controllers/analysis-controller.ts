import { Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middlewares/auth-middleware";
import { prisma } from "../db/prisma";
import { getAnalysisQueue } from "../queues/analysis-queue";
import type { AnalysisJobData } from "../queues/analysis-queue";
import { generateCounterCampaignText } from "../services/ai-service";

const analyzeBodySchema = z
  .object({
    text: z.string().min(30, "El texto debe tener al menos 30 caracteres").optional(),
    url: z.string().url().optional(),
  })
  .refine((data) => data.text || data.url, {
    message: "Debes enviar 'text' o 'url'",
    path: ["text"],
  });

export async function analyze(req: AuthenticatedRequest, res: Response): Promise<void> {
  const parsed = analyzeBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten() });
    return;
  }

  if (!req.user) {
    res.status(401).json({ message: "No autenticado" });
    return;
  }

  const { text, url } = parsed.data;

  try {
    const analysisQueue = getAnalysisQueue();
    const payload: AnalysisJobData = {
      userId: req.user.sub,
      ...(text ? { text } : {}),
      ...(url ? { url } : {}),
    };

    const job = await analysisQueue.add("analyze", payload, {
      removeOnComplete: true,
      removeOnFail: false,
    });

    res.status(202).json({
      jobId: job.id,
      status: "pending",
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error al encolar job de análisis:", err);
    if (isRedisUnavailableError(err)) {
      res.status(503).json({
        message:
          "Redis no está disponible. Arranque Redis en el puerto 6379 (por ejemplo: docker run -d -p 6379:6379 redis:7-alpine) y reinicie el backend. Luego ejecute en otra terminal: npm run worker:analysis",
      });
      return;
    }
    res.status(500).json({ message: "No se pudo encolar el análisis" });
  }
}

function isRedisUnavailableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string; cause?: unknown };
  const msg = String(e.message ?? "");
  if (e.code === "ECONNREFUSED" || e.code === "ENOTFOUND" || e.code === "ETIMEDOUT") {
    return true;
  }
  if (/ECONNREFUSED|connect ECONNREFUSED|Redis connection|enableOfflineQueue/i.test(msg)) {
    return true;
  }
  if (e.cause && typeof e.cause === "object") {
    const c = e.cause as { code?: string };
    if (c.code === "ECONNREFUSED") return true;
  }
  return false;
}

const historyQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : undefined)),
});

export async function getHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "No autenticado" });
    return;
  }

  const parsedQuery = historyQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    res.status(400).json({ message: "Parámetros de consulta inválidos" });
    return;
  }

  const { cursor, limit } = parsedQuery.data;
  const take = !limit || Number.isNaN(limit) ? 10 : Math.min(Math.max(limit, 1), 50);

  const where: Record<string, unknown> = {
    campaign: { userId: req.user.sub },
  };

  if (cursor) {
    const cursorId = Number(cursor);
    if (!Number.isNaN(cursorId)) {
      where.id = { lt: cursorId };
    }
  }

  const analyses = await prisma.analysis.findMany({
    where,
    include: {
      campaign: {
        select: {
          id: true,
          originalText: true,
          createdAt: true,
        },
      },
    },
    orderBy: { id: "desc" },
    take: take + 1,
  });

  const hasMore = analyses.length > take;
  const items = hasMore ? analyses.slice(0, take) : analyses;
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

  res.json({ items, nextCursor });
}

export async function getAnalysisDetail(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "No autenticado" });
    return;
  }

  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "ID inválido" });
    return;
  }

  const analysis = await prisma.analysis.findFirst({
    where: {
      id,
      campaign: { userId: req.user.sub },
    },
    include: {
      campaign: true,
    },
  });

  if (!analysis) {
    res.status(404).json({ message: "Análisis no encontrado" });
    return;
  }

  res.json({ analysis });
}

export async function deleteAnalysis(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "No autenticado" });
    return;
  }

  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "ID inválido" });
    return;
  }

  const existing = await prisma.analysis.findFirst({
    where: {
      id,
      campaign: { userId: req.user.sub },
    },
    select: { id: true },
  });

  if (!existing) {
    res.status(404).json({ message: "Análisis no encontrado" });
    return;
  }

  await prisma.analysis.delete({ where: { id } });

  res.status(204).send();
}

export async function generateCounterCampaign(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "No autenticado" });
    return;
  }

  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "ID inválido" });
    return;
  }

  const analysis = await prisma.analysis.findFirst({
    where: {
      id,
      campaign: { userId: req.user.sub },
    },
    include: {
      campaign: true,
    },
  });

  if (!analysis) {
    res.status(404).json({ message: "Análisis no encontrado" });
    return;
  }

  try {
    const generatedCopy = await generateCounterCampaignText(
      analysis.campaign.originalText,
      analysis.recommendations
    );
    res.json({ copy: generatedCopy });
  } catch (err: any) {
    console.error("Error generating counter campaign:", err);
    res.status(500).json({ message: "Error interno", detail: err.message });
  }
}



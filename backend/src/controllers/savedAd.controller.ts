import { Response } from "express";
import { prisma } from "../db/prisma";
import { AuthenticatedRequest } from "../middlewares/auth-middleware";
import { z } from "zod";

const savedAdSchema = z.object({
  platform: z.string(),
  advertiserName: z.string(),
  title: z.string().optional(),
  text: z.string(),
  url: z.string().optional(),
  notes: z.string().optional(),
});

export const saveAd = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }

    const data = savedAdSchema.parse(req.body);

    const savedAd = await prisma.savedAd.create({
      data: {
        userId: Number(userId),
        platform: data.platform,
        advertiserName: data.advertiserName,
        title: data.title ?? null,
        text: data.text,
        url: data.url ?? null,
        notes: data.notes ?? null,
      },
    });

    res.status(201).json(savedAd);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Datos inválidos", details: error.errors });
      return;
    }
    console.error("Error saving ad:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getSavedAds = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }

    const ads = await prisma.savedAd.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json(ads);
  } catch (error) {
    console.error("Error fetching saved ads:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const deleteSavedAd = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const adId = parseInt(req.params.id as string, 10);

    if (!userId) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }

    if (isNaN(adId)) {
      res.status(400).json({ error: "ID de anuncio inválido" });
      return;
    }

    const ad = await prisma.savedAd.findUnique({ where: { id: adId } });

    if (!ad || ad.userId !== userId) {
      res.status(404).json({ error: "Anuncio no encontrado o no pertenece a este usuario" });
      return;
    }

    await prisma.savedAd.delete({ where: { id: adId } });

    res.json({ success: true, message: "Anuncio eliminado" });
  } catch (error) {
    console.error("Error deleting saved ad:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

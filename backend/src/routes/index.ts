import { Application, Request, Response, Router } from "express";
import rateLimit from "express-rate-limit";
import { login, register, refresh } from "../controllers/auth-controller";
import { authMiddleware, AuthenticatedRequest } from "../middlewares/auth-middleware";
import {
  analyze,
  getHistory,
  getAnalysisDetail,
  deleteAnalysis,
  generateCounterCampaign,
} from "../controllers/analysis-controller";
import { getJobStatus } from "../controllers/job-controller";
import { saveAd, getSavedAds, deleteSavedAd } from "../controllers/savedAd.controller";
import multer from "multer";
import { processPhoto } from "../controllers/photo-controller";

export function registerRoutes(app: Application): void {
  const api = Router();

  // Rate limiter estricto para análisis (consume créditos de Gemini)
  const analyzeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5, // máximo 5 análisis por hora por IP
    message: { error: 'Demasiados análisis en poco tiempo. Inténtalo en una hora.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  api.post("/auth/register", register);
  api.post("/auth/login", login);
  api.post("/auth/refresh", refresh);

  api.get(
    "/auth/me",
    authMiddleware,
    (req: AuthenticatedRequest, res: Response): void => {
      res.json({ user: req.user });
    },
  );

  api.post("/analyze", authMiddleware, analyzeLimiter, analyze);
  api.get("/jobs/:id", authMiddleware, getJobStatus);
  api.get("/analyses", authMiddleware, getHistory);
  api.get("/analyses/:id", authMiddleware, getAnalysisDetail);
  api.delete("/analyses/:id", authMiddleware, deleteAnalysis);
  api.post("/analyses/:id/counter", authMiddleware, analyzeLimiter, generateCounterCampaign);

  // Swipe File endpoints
  api.post("/swipe-file", authMiddleware, saveAd);
  api.get("/swipe-file", authMiddleware, getSavedAds);
  api.delete("/swipe-file/:id", authMiddleware, deleteSavedAd);

  // AI Photo Editor endpoint
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
  api.post("/photo-editor/process", authMiddleware, upload.single("image"), processPhoto);

  app.use("/api", api);

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      service: "ai-campaign-competitive-analyzer-backend",
      timestamp: new Date().toISOString(),
    });
  });
}


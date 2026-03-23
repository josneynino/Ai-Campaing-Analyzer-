import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth-middleware";
import { editPhotoWithAI } from "../services/photo-service";

export async function processPhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const file = req.file;
    const prompt = req.body.prompt;

    if (!file) {
      res.status(400).json({ error: "No image file provided" });
      return;
    }

    console.log(`Starting AI Photo edit for user ${req.user?.email}`);

    // Call the AI Service
    const variations = await editPhotoWithAI(file.buffer, file.mimetype, prompt);

    res.status(200).json({
      success: true,
      message: "Photo processed successfully",
      variations
    });
  } catch (error) {
    console.error("Failed to process photo", error);
    const errMsg = String((error as any)?.message || "");
    if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("exceeded")) {
      res.status(429).json({ error: "Cuota de la API de Gemini excedida. Por favor, espera un minuto e inténtalo de nuevo." });
    } else {
      res.status(500).json({ error: "Failed to process photo with AI", details: errMsg, stack: (error as any)?.stack });
    }
  }
}

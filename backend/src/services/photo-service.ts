import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env";

export type EditedPhotoVariation = {
  id: string;
  style: string;
  url: string;
  description: string;
};

export async function editPhotoWithAI(
  fileBuffer: Buffer,
  mimeType: string,
  userPrompt?: string
): Promise<EditedPhotoVariation[]> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY no está configurado.");
  }
  
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

  // 1. Describir el producto usando Gemini Vision
  const visionPrompt = "Describe el producto principal de esta imagen con extremo nivel de detalle (forma, color, material, marca visible, textura). Ignora el fondo original. Escribe solo la descripción física detallada en inglés.";
  
  const visionResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash", 
    // Fallback if 2.5 doesn't work is gemini-2.0-flash, we will use gemini-2.0-flash as that is what ai-service uses
    contents: [
      visionPrompt,
      {
        inlineData: {
          data: fileBuffer.toString("base64"),
          mimeType: mimeType
        }
      }
    ]
  }).catch(() => ai.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: [
      visionPrompt,
      { inlineData: { data: fileBuffer.toString("base64"), mimeType } }
    ]
  }));

  const productDesc = visionResponse.text?.trim() || "A highly detailed product";

  // 2. Definir 3 variaciones de contexto
  const scenarios = [
    {
      id: "var_" + Date.now() + "_1",
      style: "Cyberpunk Cinematic",
      desc: "Iluminación moderna con alto contraste, ideal para captar atención en feeds saturados.",
      aspectRatio: "16:9",
      prompt: `${productDesc}. Product photography set in a highly professional studio with bright neon cyberpunk lighting, dark background, 8k resolution, photorealistic, cinematic.`
    },
    {
      id: "var_" + Date.now() + "_2",
      style: "Corporate Minimalist",
      desc: "Recorte 1:1 con sombras suaves y fondo limpio, perfecto para LinkedIn o campañas formales.",
      aspectRatio: "1:1",
      prompt: `${productDesc}. Product photography set in a clean minimalist corporate environment, soft natural lighting and shadows, pristine white desk, photorealistic, 8k, highly detailed.`
    },
    {
      id: "var_" + Date.now() + "_3",
      style: "Story Format",
      desc: "Fondo atractivo enfocado para encajar en Historias de Instagram/TikTok.",
      aspectRatio: "9:16",
      prompt: `${productDesc}. Product photography placed creatively on a beautiful marble surface, modern vertical story-format aesthetic, lifestyle marketing ad style, photorealistic.`
    }
  ];

  // 3. Generar imágenes con Imagen 3
  const variations: EditedPhotoVariation[] = [];

  for (const scenario of scenarios) {
    try {
      const imgRes = await ai.models.generateImages({
        model: 'imagen-3.0-generate-001',
        prompt: scenario.prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: scenario.aspectRatio,
          outputMimeType: "image/jpeg"
        }
      });

      const base64Bytes = imgRes.generatedImages?.[0]?.image?.imageBytes;
      if (base64Bytes) {
        variations.push({
          id: scenario.id,
          style: scenario.style,
          url: `data:image/jpeg;base64,${base64Bytes}`,
          description: scenario.desc
        });
      }
    } catch (e) {
      console.error(`Failed to generate scenario ${scenario.style}: `, e);
    }
  }

  if (variations.length === 0) {
    throw new Error("No se pudo generar ninguna variación con la IA.");
  }

  return variations;
}

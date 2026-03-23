import { GoogleGenAI } from "@google/genai";
import { config } from "dotenv";
config();
async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
  try {
      console.log("Testing generation...");
      const res = await ai.models.generateContent({
        model: "gemini-2.0-flash-lite", 
        contents: ["Hello"],
      });
      console.log("Text success:", res.text?.substring(0, 20));
      
      console.log("Testing Imagen 3...");
      const imgRes = await ai.models.generateImages({
        model: 'imagen-3.0-generate-001',
        prompt: "A minimal office",
        config: {
          numberOfImages: 1,
          outputMimeType: "image/jpeg",
          aspectRatio: "1:1"
        }
      });
      console.log("Result:", imgRes ? "Got image" : "No image");
  } catch (e: any) {
      console.error("ERROR:", e?.message || e);
  }
}
test();

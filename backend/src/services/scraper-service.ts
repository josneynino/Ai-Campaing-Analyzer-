/// <reference lib="dom" />
import puppeteer from "puppeteer";
import pino from "pino";
import { env } from "../config/env";

const logger = pino({ level: env.LOG_LEVEL ?? "info" });

declare const document: Document;

const MAX_TEXT_LENGTH = 8000;

function cleanText(raw: string): string {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n")
    .replace(/\s+\n/g, "\n")
    .trim();
}

export async function scrapePageText(url: string): Promise<string> {
  if (!/^https?:\/\//i.test(url)) {
    throw new Error("INVALID_URL");
  }

  const browser = await puppeteer.launch({
    headless: true,
    timeout: 60000, // 60 segundos máximo para lanzar browser
    // Necesario en Docker/Linux sin sandbox privilegiado (ver backend/Dockerfile)
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    );

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30_000,
    });

    const rawText = await page.evaluate(() => {
      document
        .querySelectorAll("script, style, noscript, iframe, svg, canvas")
        .forEach((el: Element) => el.remove());
      return document.body ? document.body.innerText || "" : "";
    });

    const cleaned = cleanText(rawText);

    if (!cleaned || cleaned.length < 30) {
      throw new Error(
        "No se encontró suficiente texto en la página. Prueba con otra URL o pega el texto del anuncio manualmente.",
      );
    }

    const truncated =
      cleaned.length > MAX_TEXT_LENGTH
        ? `${cleaned.slice(0, MAX_TEXT_LENGTH)}\n\n[Texto truncado para análisis]`
        : cleaned;

    return truncated;
  } catch (error) {
    logger.error({ error }, "Error al hacer scraping");
    const msg = (error as Error).message;
    if (msg.startsWith("No se encontró suficiente texto")) {
      throw error;
    }
    throw new Error(
      "No se pudo leer esta página (redes sociales o sitios protegidos suelen fallar). Usa una URL de landing pública o pega el texto del anuncio en «Pegar texto».",
      { cause: error },
    );
  } finally {
    await browser.close();
  }
}


import { prisma } from "../db/prisma";
import {
  AnalysisResult,
  analyzeCampaignText,
  detectNicheAndKeywords,
} from "./ai-service";
import { scrapePageText } from "./scraper-service";
import { findCompetitors, NormalizedCompetitor } from "./competitor-service";

async function persistAnalysis(
  userId: number,
  originalText: string,
  aiResult: AnalysisResult,
  originalUrl: string | undefined,
  niche: string | null,
  competitors: NormalizedCompetitor[],
) {
  const campaign = await prisma.campaign.create({
    data: {
      userId,
      originalText,
      originalUrl: originalUrl ?? null,
      nicheDetected: niche,
    },
  });

  const analysis = await prisma.analysis.create({
    data: {
      campaignId: campaign.id,
      summary: aiResult.summary,
      clarityScore: aiResult.clarityScore,
      persuasionScore: aiResult.persuasionScore,
      differentiationScore: aiResult.differentiationScore,
      ctaScore: aiResult.ctaScore,
      conversionScore: aiResult.conversionScore,
      recommendations: aiResult.recommendations,
      optimizedVersion: aiResult.optimizedVersion,
    },
  });

  if (competitors.length > 0) {
    await prisma.competitor.createMany({
      data: competitors.map((c) => ({
        campaignId: campaign.id,
        source: c.source,
        platform: c.platform,
        advertiserName: c.advertiserName,
        title: c.title ?? null,
        text: c.text,
        url: c.url ?? null,
      })),
    });
  }

  return { campaign, analysis };
}

function buildCompetitorContext(competitors: NormalizedCompetitor[]): string {
  if (competitors.length === 0) return "";

  const lines = competitors.map((c, index) => {
    const header = `${index + 1}. [${c.platform} · ${c.source}] ${c.advertiserName}${
      c.title ? ` — ${c.title}` : ""
    }`;
    return `${header}\n${c.text}`;
  });

  return `\n\n---\nCOMPETIDORES RELEVANTES (contexto para el análisis, NO copiar tal cual):\n${lines.join(
    "\n\n",
  )}`;
}

async function runFullPipeline(
  userId: number,
  baseText: string,
  originalUrl?: string,
) {
  // 1) Detectar nicho y keywords con IA
  let niche: string | null = null;
  let keywords: string[] = [];

  try {
    const nicheResult = await detectNicheAndKeywords(baseText);
    niche = nicheResult.niche;
    keywords = nicheResult.keywords;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("No se pudo detectar nicho, continuando sin nicho:", error);
  }

  // 2) Buscar campañas competidoras en canales externos
  let competitors: NormalizedCompetitor[] = [];
  if (keywords.length > 0) {
    try {
      competitors = await findCompetitors(niche ?? "", keywords);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("No se pudieron obtener competidores:", error);
    }
  }

  // 3) Enriquecer el texto para la IA con contexto de competidores
  const enrichedText = `${baseText}${buildCompetitorContext(competitors)}`;

  // 4) Análisis principal con IA
  const aiResult: AnalysisResult = await analyzeCampaignText(enrichedText);

  // 5) Persistir campaña, análisis y competidores normalizados
  return persistAnalysis(userId, baseText, aiResult, originalUrl, niche, competitors);
}

export async function createAnalysisForText(userId: number, text: string) {
  return runFullPipeline(userId, text);
}

export async function createAnalysisFromUrl(userId: number, url: string) {
  const scrapedText = await scrapePageText(url);
  return runFullPipeline(userId, scrapedText, url);
}


import "dotenv/config";
import { Worker, Job } from "bullmq";
import { redisConnectionForWorker } from "../config/redis";
import { AnalysisJobData } from "../queues/analysis-queue";
import { createAnalysisForText, createAnalysisFromUrl } from "../services/analysis-service";

type AnalysisJobResult = {
  analysisId: number;
  campaignId: number;
};

const worker = new Worker<AnalysisJobData, AnalysisJobResult>(
  "analysisQueue",
  async (job: Job<AnalysisJobData>): Promise<AnalysisJobResult> => {
    const { userId, text, url } = job.data;

    if (!userId) {
      throw new Error("Falta userId en el job");
    }

    if (!text && !url) {
      throw new Error("El job debe contener text o url");
    }

    const result = text
      ? await createAnalysisForText(userId, text)
      : await createAnalysisFromUrl(userId, url!);

    return {
      analysisId: result.analysis.id,
      campaignId: result.campaign.id,
    };
  },
  {
    connection: redisConnectionForWorker,
  },
);

worker.on("completed", (job) => {
  // eslint-disable-next-line no-console
  console.log(`Job de análisis completado: ${job.id}`);
});

worker.on("failed", (job, err) => {
  // eslint-disable-next-line no-console
  console.error(`Job de análisis falló: ${job?.id}`, err);
});


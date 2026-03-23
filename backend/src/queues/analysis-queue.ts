import { Queue } from "bullmq";
import { redisConnectionForQueue } from "../config/redis";

export type AnalysisJobData = {
  userId: number;
  text?: string;
  url?: string;
};

let analysisQueue: Queue<AnalysisJobData> | null = null;

// Lazy init: evita que el backend falle en el arranque si Redis no está listo.
export function getAnalysisQueue(): Queue<AnalysisJobData> {
  if (!analysisQueue) {
    analysisQueue = new Queue<AnalysisJobData>("analysisQueue", {
      connection: redisConnectionForQueue,
    });
  }
  return analysisQueue;
}


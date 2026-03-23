import { Request, Response } from "express";
import { getAnalysisQueue } from "../queues/analysis-queue";

type JobStatus = "pending" | "processing" | "completed" | "failed";

export async function getJobStatus(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);

  const job = await getAnalysisQueue().getJob(id);
  if (!job) {
    res.status(404).json({ message: "Job no encontrado" });
    return;
  }

  const state = await job.getState();

  let status: JobStatus;
  switch (state) {
    case "completed":
      status = "completed";
      break;
    case "failed":
      status = "failed";
      break;
    case "active":
      status = "processing";
      break;
    default:
      status = "pending";
  }

  const payload: {
    jobId: string;
    status: JobStatus;
    result?: unknown;
    error?: string;
  } = {
    jobId: String(job.id),
    status,
  };

  if (status === "completed") {
    payload.result = job.returnvalue;
  }

  if (status === "failed") {
    payload.error = job.failedReason ?? "Job failed";
  }

  res.json(payload);
}


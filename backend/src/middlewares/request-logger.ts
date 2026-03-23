import { NextFunction, Request, Response } from "express";
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
});

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    logger.info(
      {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
      },
      "request_completed",
    );
  });

  next();
}


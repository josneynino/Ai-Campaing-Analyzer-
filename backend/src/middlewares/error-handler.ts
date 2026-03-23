import { NextFunction, Request, Response } from "express";
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
});

// Centralized error handler with structured logging
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void {
  // Log error without exposing sensitive data
  logger.error({
    error: err instanceof Error ? err.message : 'Unknown error',
    stack: err instanceof Error ? err.stack : undefined,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  }, 'Request failed');

  // Don't expose error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  const status = (typeof err === 'object' && err !== null && 'status' in err && typeof (err as { status: unknown }).status === 'number') 
    ? (err as { status: number }).status 
    : 500;
  const message = isDevelopment && err instanceof Error 
    ? err.message 
    : 'Internal server error';

  res.status(status).json({
    error: {
      message,
      ...(isDevelopment && err instanceof Error && { stack: err.stack }),
    },
  });
}


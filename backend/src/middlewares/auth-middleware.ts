import { NextFunction, Request, Response } from "express";
import { verifyToken, DecodedToken } from "../services/auth-service";

export interface AuthenticatedRequest extends Request {
  user?: DecodedToken;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "No autenticado" });
    return;
  }

  const token = authHeader.substring("Bearer ".length);

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Token inválido o expirado" });
  }
}


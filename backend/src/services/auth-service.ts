import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { prisma } from "../db/prisma";
import { env } from "../config/env";

const SALT_ROUNDS = 10;

export type AuthUser = {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
};

export async function registerUser(
  email: string, 
  password: string, 
  firstName: string, 
  lastName: string, 
  phone?: string
): Promise<AuthUser> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("EMAIL_TAKEN");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, passwordHash, firstName, lastName, phone: phone ?? null },
  });

  return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName };
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName };
}

export function signToken(user: AuthUser): string {
  const payload = { sub: user.id, email: user.email };
  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '15m', // Access token corto
  });
  return token;
}

export function signRefreshToken(user: AuthUser): string {
  const payload = { sub: user.id, email: user.email };
  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d', // Refresh token largo
  });
  return token;
}

export async function storeRefreshToken(userId: number, refreshToken: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken },
  });
}

export async function verifyRefreshToken(token: string): Promise<AuthUser | null> {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as DecodedToken;
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub, refreshToken: token },
    });
    if (!user) return null;
    return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName };
  } catch {
    return null;
  }
}

export async function revokeRefreshToken(userId: number): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
}

export type DecodedToken = JwtPayload & {
  sub: number;
  email: string;
};

export function verifyToken(token: string): DecodedToken {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (typeof decoded === "string" || typeof decoded.sub !== "number" || !decoded.email) {
    throw new Error("INVALID_TOKEN_PAYLOAD");
  }

  return decoded as DecodedToken;
}


import { Request, Response } from "express";
import { z } from "zod";
import { loginUser, registerUser, signToken, signRefreshToken, storeRefreshToken, verifyRefreshToken } from "../services/auth-service";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  phone: z.string().optional(),
});

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten() });
    return;
  }

  const { email, password, firstName, lastName, phone } = parsed.data;

  try {
    const user = await registerUser(email, password, firstName, lastName, phone);
    const token = signToken(user);

    res.status(201).json({
      user,
      token,
    });
  } catch (err) {
    if ((err as Error).message === "EMAIL_TAKEN") {
      res.status(409).json({ message: "El email ya está registrado" });
      return;
    }

    res.status(500).json({ message: "No se pudo registrar el usuario" });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const user = await loginUser(email, password);
    const token = signToken(user);
    const refreshToken = signRefreshToken(user);
    await storeRefreshToken(user.id, refreshToken);

    res.status(200).json({
      user,
      token,
      refreshToken,
    });
  } catch (err) {
    if ((err as Error).message === "INVALID_CREDENTIALS") {
      res.status(401).json({ message: "Credenciales inválidas" });
      return;
    }
    res.status(500).json({ message: "No se pudo iniciar sesión" });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    res.status(400).json({ message: "Refresh token requerido" });
    return;
  }

  try {
    const user = await verifyRefreshToken(refreshToken);
    if (!user) {
      res.status(401).json({ message: "Refresh token inválido" });
      return;
    }

    const newToken = signToken(user);
    const newRefreshToken = signRefreshToken(user);
    await storeRefreshToken(user.id, newRefreshToken);

    res.status(200).json({
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("refresh token error:", err);
    res.status(500).json({ message: "No se pudo refrescar el token" });
  }
}


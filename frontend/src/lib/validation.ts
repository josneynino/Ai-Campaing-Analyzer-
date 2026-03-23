import { z } from 'zod';

// Esquemas de validación para formularios
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  phone: z.string().min(1, 'El número telefónico es obligatorio'),
});

export const analyzeUrlSchema = z.object({
  url: z.string().url('URL inválida').refine(
    (url) => /^https?:\/\//i.test(url),
    'La URL debe comenzar con http:// o https://'
  ),
});

export const analyzeTextSchema = z.object({
  text: z.string().min(10, 'El texto debe tener al menos 10 caracteres'),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type AnalyzeUrlForm = z.infer<typeof analyzeUrlSchema>;
export type AnalyzeTextForm = z.infer<typeof analyzeTextSchema>;
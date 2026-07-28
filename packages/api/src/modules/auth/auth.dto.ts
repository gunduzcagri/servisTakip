import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Gecerli bir e-posta giriniz"),
  password: z.string().min(6, "Sifre en az 6 karakter olmalidir"),
});

export const registerSchema = z.object({
  email: z.string().email("Gecerli bir e-posta giriniz"),
  password: z.string().min(6, "Sifre en az 6 karakter olmalidir"),
  fullName: z.string().min(2, "Ad soyad en az 2 karakter olmalidir"),
  phone: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

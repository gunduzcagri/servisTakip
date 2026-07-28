import { z } from "zod";
import { UserRole } from "@prisma/client";

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole),
  branchId: z.string().uuid().optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  branchId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

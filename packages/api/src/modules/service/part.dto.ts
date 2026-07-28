import { z } from "zod";

export const createPartSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().optional(),
  unitPrice: z.number().min(0),
  stockQuantity: z.number().int().min(0).default(0),
  criticalThreshold: z.number().int().min(1).default(5),
});

export const updatePartSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  description: z.string().optional(),
  unitPrice: z.number().min(0).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  criticalThreshold: z.number().int().min(1).optional(),
});

export const stockAdjustSchema = z.object({
  quantity: z.number().int(),
  reason: z.string().optional(),
});

export type CreatePartInput = z.infer<typeof createPartSchema>;
export type UpdatePartInput = z.infer<typeof updatePartSchema>;
export type StockAdjustInput = z.infer<typeof stockAdjustSchema>;

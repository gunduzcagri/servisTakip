import { z } from "zod";

export const createServiceSchema = z.object({
  customerId: z.string().uuid(),
  deviceId: z.string().uuid(),
  technicianId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  faultDescription: z.string().optional(),
  estimatedCost: z.number().optional(),
  estimatedDelivery: z.string().datetime().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum([
    "RECEIVED", "INSPECTING", "PRICE_OFFER", "APPROVED",
    "CANCELLED", "PARTS_WAITING", "REPAIRING", "QC", "READY", "DELIVERED",
  ]),
  note: z.string().optional(),
});

export const addActionSchema = z.object({
  description: z.string().min(1),
  laborCost: z.number().optional(),
  timeSpentMin: z.number().int().optional(),
});

export const addPartSchema = z.object({
  partId: z.string().uuid(),
  quantity: z.number().int().min(1).default(1),
});

export const quoteSchema = z.object({
  estimatedCost: z.number().min(0),
  estimatedDelivery: z.string().datetime().optional(),
  note: z.string().optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type AddActionInput = z.infer<typeof addActionSchema>;
export type AddPartInput = z.infer<typeof addPartSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;

import { z } from "zod";

export const createPartSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().optional(),
  unitPrice: z.number().min(0),
  stockQuantity: z.number().int().min(0).default(0),
  criticalThreshold: z.number().int().min(1).default(5),
  minStockLevel: z.number().int().min(0).default(10),
  maxStockLevel: z.number().int().optional(),
  supplierId: z.string().optional(),
  location: z.string().optional(),
  barcode: z.string().optional(),
});

export const updatePartSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  description: z.string().optional(),
  unitPrice: z.number().min(0).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  criticalThreshold: z.number().int().min(1).optional(),
  minStockLevel: z.number().int().min(0).optional(),
  maxStockLevel: z.number().int().optional(),
  supplierId: z.string().optional(),
  location: z.string().optional(),
  barcode: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const stockAdjustSchema = z.object({
  quantity: z.number().int(),
  reason: z.string().optional(),
  type: z.enum(["IN", "OUT", "ADJUSTMENT", "RETURN"]).default("ADJUSTMENT"),
});

export const createSupplierSchema = z.object({
  name: z.string().min(1),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  taxOffice: z.string().optional(),
});

export const updateSupplierSchema = z.object({
  name: z.string().min(1).optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  taxOffice: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string(),
  items: z.array(z.object({
    partId: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().min(0),
  })),
  notes: z.string().optional(),
  expectedDate: z.string().optional(),
});

export type CreatePartInput = z.infer<typeof createPartSchema>;
export type UpdatePartInput = z.infer<typeof updatePartSchema>;
export type StockAdjustInput = z.infer<typeof stockAdjustSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;

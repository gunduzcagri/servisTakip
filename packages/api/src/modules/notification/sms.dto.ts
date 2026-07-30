import { z } from "zod";

export const smsProviderSchema = z.object({
  name: z.string().min(1),
  provider: z.enum(["NETGSM", "TWILIO", "BULKSMS"]),
  isActive: z.boolean().default(false),
  config: z.record(z.any()),
});

export const sendSmsSchema = z.object({
  recipient: z.string().min(10),
  message: z.string().min(1).max(918),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
});

export const updateSmsConfigSchema = z.object({
  isActive: z.boolean().optional(),
  config: z.record(z.any()).optional(),
});

export type SmsProviderInput = z.infer<typeof smsProviderSchema>;
export type SendSmsInput = z.infer<typeof sendSmsSchema>;
export type UpdateSmsConfigInput = z.infer<typeof updateSmsConfigSchema>;

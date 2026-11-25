import { z } from 'zod';

export const updateSettingsSchema = z.object({
  storeName: z.string().trim().min(2).max(120).optional(),
  supportPhone: z.string().trim().max(30).optional(),
  whatsappNumber: z.string().trim().max(30).optional(),
  supportEmail: z.string().trim().email('Invalid support email').optional().or(z.literal('')),
  storeAddress: z.string().trim().max(300).optional(),
  defaultDeliveryCharge: z.coerce.number().int().min(0).max(5000).optional(),
  freeDeliveryMinOrder: z.coerce.number().int().min(0).max(100000).optional(),
  estimatedDeliveryDays: z.string().trim().max(50).optional(),
  announcementEnabled: z.boolean().optional(),
  announcementText: z.string().trim().max(300).optional(),
  isOrderingEnabled: z.boolean().optional(),
  orderAlertEmail: z.string().trim().email('Invalid alert email').optional().or(z.literal('')),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

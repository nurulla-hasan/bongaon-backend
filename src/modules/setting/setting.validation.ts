import { z } from 'zod';

export const heroBannerSchema = z.object({
  id: z.string().trim().min(1).max(64),
  title: z.string().trim().max(120).optional().default(''),
  subtitle: z.string().trim().max(240).optional().default(''),
  imageUrl: z.string().trim().min(1, 'Banner image URL is required').max(500),
  imagePublicId: z.string().trim().max(300).optional(),
  linkUrl: z.string().trim().max(300).optional().default(''),
  isActive: z.boolean().optional().default(true),
});

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
  heroBanners: z.array(heroBannerSchema).max(10).optional(),
  isOrderingEnabled: z.boolean().optional(),
  orderAlertEmail: z.string().trim().email('Invalid alert email').optional().or(z.literal('')),
});

export type HeroBannerInput = z.infer<typeof heroBannerSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

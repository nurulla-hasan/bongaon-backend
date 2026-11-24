import { z } from 'zod';

export const orderItemInputSchema = z.object({
  productId: z.string().uuid('Valid productId is required'),
  selectedPack: z.string().trim().min(1, 'selectedPack is required').max(50),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(50),
});

export const createOrderSchema = z.object({
  receiverName: z.string().trim().min(2, 'Receiver name is required').max(120),
  receiverPhone: z.string().trim().min(6, 'Valid receiver phone is required').max(30),
  district: z.string().trim().min(2, 'District is required').max(100),
  fullAddress: z.string().trim().min(5, 'Full address is required').max(500),
  whatsappNumber: z.string().trim().max(30).optional().default(''),
  orderNote: z.string().trim().max(500).optional().default(''),
  items: z.array(orderItemInputSchema).min(1, 'At least one item is required').max(30),
});

export const trackOrderQuerySchema = z.object({
  phone: z.string().trim().min(6, 'Phone number is required to track order').max(30),
});

export const getOrdersQuerySchema = z.object({
  searchTerm: z.string().optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']).optional(),
  district: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['newest', 'oldest', 'total_asc', 'total_desc']).default('newest'),
});

export const getMyOrdersQuerySchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type TrackOrderQueryInput = z.infer<typeof trackOrderQuerySchema>;
export type GetOrdersQueryInput = z.infer<typeof getOrdersQuerySchema>;
export type GetMyOrdersQueryInput = z.infer<typeof getMyOrdersQuerySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

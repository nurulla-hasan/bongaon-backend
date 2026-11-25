import { z } from 'zod';

export const getReviewsQuerySchema = z.object({
  searchTerm: z.string().optional(),
  productId: z.string().uuid('Invalid productId').optional(),
  productSlug: z.string().trim().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  isApproved: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['newest', 'oldest', 'rating_desc', 'rating_asc']).default('newest'),
});

export const createReviewSchema = z.object({
  productId: z.string().uuid('Valid productId is required'),
  customerName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  location: z.string().trim().max(100).optional().default(''),
  phone: z.string().trim().min(6, 'Valid phone number is required').max(30).optional(),
  orderNumber: z.string().trim().min(3).max(50).optional(),
  rating: z.coerce.number().int().min(1, 'Rating must be between 1 and 5').max(5),
  comment: z.string().trim().min(5, 'Comment must be at least 5 characters').max(1000),
});

export const updateReviewSchema = z.object({
  isApproved: z.boolean(),
});

export type GetReviewsQueryInput = z.infer<typeof getReviewsQuerySchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

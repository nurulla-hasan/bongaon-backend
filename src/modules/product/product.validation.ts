import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const packOptionSchema = z.object({
  label: z.string().trim().min(1, 'Pack label is required').max(50),
  price: z.coerce.number().int().positive('Pack price must be positive'),
  originalPrice: z.coerce.number().int().positive().optional(),
});

export const getProductsQuerySchema = z.object({
  searchTerm: z.string().optional(),
  categoryId: z.string().uuid('Invalid categoryId').optional(),
  categorySlug: z.string().trim().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  isFeatured: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z
    .enum(['newest', 'oldest', 'price_asc', 'price_desc', 'rating_desc', 'name_asc'])
    .default('newest'),
});

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Product name must be at least 2 characters.')
    .max(150, 'Product name cannot exceed 150 characters.'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters.')
    .max(160, 'Slug cannot exceed 160 characters.')
    .regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens.')
    .optional(),
  shortTag: z.string().trim().max(80).optional().default(''),
  badge: z.string().trim().max(50).optional().nullable(),
  categoryId: z.string().uuid('Valid categoryId is required.'),
  price: z.coerce.number().int().positive('Price must be a positive integer.'),
  originalPrice: z.coerce.number().int().positive().optional().nullable(),
  unit: z.string().trim().min(1).max(50).optional().default('250g'),
  stock: z.coerce.number().int().min(0).optional().default(0),
  deliveryDays: z.string().trim().max(50).optional().default('4-7 Days'),
  shelfLife: z.string().trim().max(150).optional().default(''),
  origin: z.string().trim().max(150).optional().default(''),
  description: z.string().trim().min(10, 'Description must be at least 10 characters.'),
  highlights: z.array(z.string().trim().min(1)).optional().default([]),
  ingredients: z.array(z.string().trim().min(1)).optional().default([]),
  packOptions: z.array(packOptionSchema).optional().default([]),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(160)
    .regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens.')
    .optional(),
  shortTag: z.string().trim().max(80).optional(),
  badge: z.string().trim().max(50).optional().nullable(),
  categoryId: z.string().uuid('Valid categoryId is required.').optional(),
  price: z.coerce.number().int().positive().optional(),
  originalPrice: z.coerce.number().int().positive().optional().nullable(),
  unit: z.string().trim().min(1).max(50).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  deliveryDays: z.string().trim().max(50).optional(),
  shelfLife: z.string().trim().max(150).optional(),
  origin: z.string().trim().max(150).optional(),
  description: z.string().trim().min(10).optional(),
  highlights: z.array(z.string().trim().min(1)).optional(),
  ingredients: z.array(z.string().trim().min(1)).optional(),
  packOptions: z.array(packOptionSchema).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const removeGalleryImageSchema = z.object({
  publicId: z.string().trim().min(1, 'publicId is required'),
});

export type GetProductsQueryInput = z.infer<typeof getProductsQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type RemoveGalleryImageInput = z.infer<typeof removeGalleryImageSchema>;

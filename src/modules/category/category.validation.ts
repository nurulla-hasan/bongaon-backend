import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const getCategoriesQuerySchema = z.object({
  searchTerm: z.string().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['sort_order', 'newest', 'oldest', 'name_asc', 'name_desc']).default('sort_order'),
});

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Category name must be at least 2 characters.')
    .max(100, 'Category name cannot exceed 100 characters.'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters.')
    .max(120, 'Slug cannot exceed 120 characters.')
    .regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens.')
    .optional(),
  subtitle: z.string().trim().max(255).optional().default(''),
  iconName: z.string().trim().max(50).optional().default('package'),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Category name must be at least 2 characters.')
    .max(100, 'Category name cannot exceed 100 characters.')
    .optional(),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters.')
    .max(120, 'Slug cannot exceed 120 characters.')
    .regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens.')
    .optional(),
  subtitle: z.string().trim().max(255).optional(),
  iconName: z.string().trim().max(50).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type GetCategoriesQueryInput = z.infer<typeof getCategoriesQuerySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

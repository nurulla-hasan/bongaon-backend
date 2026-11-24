import { z } from 'zod';

export const getContactsQuerySchema = z.object({
  searchTerm: z.string().optional(),
  status: z.enum(['NEW', 'READ', 'REPLIED', 'ARCHIVED']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['newest', 'oldest']).default('newest'),
});

export const createContactSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  phone: z.string().trim().min(6, 'Valid phone number is required').max(30),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  subject: z.string().trim().max(150).optional().default(''),
  message: z.string().trim().min(5, 'Message must be at least 5 characters').max(2000),
});

export const updateContactStatusSchema = z.object({
  status: z.enum(['NEW', 'READ', 'REPLIED', 'ARCHIVED']),
});

export const replyContactSchema = z.object({
  subject: z.string().trim().min(2).max(150).optional(),
  replyMessage: z.string().trim().min(2, 'Reply message must be at least 2 characters').max(3000),
});

export type GetContactsQueryInput = z.infer<typeof getContactsQuerySchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactStatusInput = z.infer<typeof updateContactStatusSchema>;
export type ReplyContactInput = z.infer<typeof replyContactSchema>;

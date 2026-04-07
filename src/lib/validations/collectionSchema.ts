import { z } from 'zod';

export const collectionSchema = z.object({
  paid_by: z.string().uuid('Invalid user').optional(),
  paid_to: z.string().uuid('Select who you paid'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Must be a positive number'),
  description: z.string().optional(),
  collection_date: z.string().min(1, 'Date is required'),
});

export type CollectionFormData = z.infer<typeof collectionSchema>;

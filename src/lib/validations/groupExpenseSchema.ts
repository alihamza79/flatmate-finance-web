import { z } from 'zod';

export const groupExpenseSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Must be a positive number'),
  description: z.string().optional(),
  split_type: z.enum(['equal', 'custom']),
  expense_date: z.string().min(1, 'Date is required'),
  participants: z.array(z.string().uuid()).min(0),
  custom_split: z
    .array(
      z.object({
        user_id: z.string().uuid(),
        amount: z.string(),
      }),
    )
    .optional(),
});

export type GroupExpenseFormData = z.infer<typeof groupExpenseSchema>;

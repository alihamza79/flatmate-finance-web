import { z } from 'zod';

export const personalExpenseSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Must be a positive number'),
  description: z.string().optional(),
  category: z.string().optional(),
  expense_date: z.string().min(1, 'Date is required'),
});

export type PersonalExpenseFormData = z.infer<typeof personalExpenseSchema>;

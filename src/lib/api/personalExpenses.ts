import { supabase } from '@/lib/supabase';
import type { PersonalExpense } from '@/types';

export async function fetchPersonalExpenses(): Promise<PersonalExpense[]> {
  const { data, error } = await supabase
    .from('personal_expenses')
    .select('*')
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export type CreatePersonalExpenseInput = {
  amount: number;
  description: string | null;
  category: string | null;
  expense_date: string;
};

export async function createPersonalExpense(input: CreatePersonalExpenseInput): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('personal_expenses').insert({
    user_id: user.id,
    amount: input.amount,
    description: input.description,
    category: input.category,
    expense_date: input.expense_date,
  });

  if (error) throw new Error(error.message);
}

export type UpdatePersonalExpenseInput = CreatePersonalExpenseInput & { id: string };

export async function updatePersonalExpense(input: UpdatePersonalExpenseInput): Promise<void> {
  const { error } = await supabase
    .from('personal_expenses')
    .update({
      amount: input.amount,
      description: input.description,
      category: input.category,
      expense_date: input.expense_date,
    })
    .eq('id', input.id);

  if (error) throw new Error(error.message);
}

export async function deletePersonalExpense(id: string): Promise<void> {
  const { error } = await supabase.from('personal_expenses').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

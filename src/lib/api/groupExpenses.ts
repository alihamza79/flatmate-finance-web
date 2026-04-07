import { supabase } from '@/lib/supabase';
import type { GroupExpenseWithDetails, SplitType } from '@/types';

export async function fetchGroupExpenses(): Promise<GroupExpenseWithDetails[]> {
  const { data, error } = await supabase
    .from('group_expenses')
    .select(`
      *,
      creator:profiles!created_by(*),
      participants:expense_participants(
        *,
        profile:profiles!user_id(*)
      )
    `)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as GroupExpenseWithDetails[];
}

export type CreateGroupExpenseInput = {
  amount: number;
  description: string | null;
  split_type: SplitType;
  expense_date: string;
  participants: { user_id: string; share_amount: number }[];
};

export async function createGroupExpense(input: CreateGroupExpenseInput): Promise<void> {
  const { error } = await supabase.rpc('create_group_expense', {
    p_amount: Math.round(input.amount * 100) / 100,
    p_description: input.description ?? '',
    p_split_type: input.split_type,
    p_expense_date: input.expense_date,
    p_participants: input.participants.map((p) => ({
      user_id: p.user_id,
      share_amount: Math.round(p.share_amount * 100) / 100,
    })),
  });

  if (error) throw new Error(error.message);
}

export type UpdateGroupExpenseInput = CreateGroupExpenseInput & { id: string };

export async function updateGroupExpense(input: UpdateGroupExpenseInput): Promise<void> {
  const { error } = await supabase.rpc('update_group_expense', {
    p_expense_id: input.id,
    p_amount: Math.round(input.amount * 100) / 100,
    p_description: input.description ?? '',
    p_split_type: input.split_type,
    p_expense_date: input.expense_date,
    p_participants: input.participants.map((p) => ({
      user_id: p.user_id,
      share_amount: Math.round(p.share_amount * 100) / 100,
    })),
  });

  if (error) throw new Error(error.message);
}

export async function deleteGroupExpense(id: string): Promise<void> {
  const { error } = await supabase.from('group_expenses').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

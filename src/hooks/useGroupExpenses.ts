import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchGroupExpenses,
  createGroupExpense,
  updateGroupExpense,
  deleteGroupExpense,
  type CreateGroupExpenseInput,
  type UpdateGroupExpenseInput,
} from '@/lib/api/groupExpenses';
import { QUERY_KEYS } from '@/config/constants';

export function useGroupExpenses() {
  return useQuery({
    queryKey: QUERY_KEYS.groupExpenses,
    queryFn: fetchGroupExpenses,
  });
}

export function useCreateGroupExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGroupExpenseInput) => createGroupExpense(input),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: QUERY_KEYS.groupExpenses });
    },
  });
}

export function useUpdateGroupExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateGroupExpenseInput) => updateGroupExpense(input),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: QUERY_KEYS.groupExpenses });
    },
  });
}

export function useDeleteGroupExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGroupExpense(id),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: QUERY_KEYS.groupExpenses });
    },
  });
}

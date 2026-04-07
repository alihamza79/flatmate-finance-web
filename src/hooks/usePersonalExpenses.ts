import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPersonalExpenses,
  createPersonalExpense,
  updatePersonalExpense,
  deletePersonalExpense,
  type CreatePersonalExpenseInput,
  type UpdatePersonalExpenseInput,
} from '@/lib/api/personalExpenses';
import { QUERY_KEYS } from '@/config/constants';

export function usePersonalExpenses() {
  return useQuery({
    queryKey: QUERY_KEYS.personalExpenses,
    queryFn: fetchPersonalExpenses,
  });
}

export function useCreatePersonalExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePersonalExpenseInput) => createPersonalExpense(input),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: QUERY_KEYS.personalExpenses });
    },
  });
}

export function useUpdatePersonalExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePersonalExpenseInput) => updatePersonalExpense(input),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: QUERY_KEYS.personalExpenses });
    },
  });
}

export function useDeletePersonalExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePersonalExpense(id),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: QUERY_KEYS.personalExpenses });
    },
  });
}

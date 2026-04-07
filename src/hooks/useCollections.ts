import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/constants';
import {
  fetchCollections,
  createCollection,
  updateCollectionStatus,
  deleteCollection,
  type CreateCollectionInput,
} from '@/lib/api/collections';
import type { CollectionStatus } from '@/types';

export function useCollections() {
  return useQuery({
    queryKey: QUERY_KEYS.collections,
    queryFn: fetchCollections,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCollectionInput) => createCollection(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.collections }),
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.groupExpenses }),
      ]);
    },
  });
}

export function useUpdateCollectionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CollectionStatus }) =>
      updateCollectionStatus(id, status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.collections }),
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.groupExpenses }),
      ]);
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCollection(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.collections }),
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.groupExpenses }),
      ]);
    },
  });
}

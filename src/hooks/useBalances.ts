import { useMemo } from 'react';
import { useGroupExpenses } from './useGroupExpenses';
import { useProfiles } from './useProfiles';
import { useCollections } from './useCollections';
import { calculateBalances, getNetBalance } from '@/lib/utils/calculateBalances';
import type { BalanceEntry } from '@/types';

export function useBalances(): {
  balances: BalanceEntry[];
  isLoading: boolean;
  isError: boolean;
} {
  const { data: expenses, isLoading: expensesLoading, isError: expensesError } = useGroupExpenses();
  const { data: profiles, isLoading: profilesLoading, isError: profilesError } = useProfiles();
  const { data: collections, isLoading: collectionsLoading, isError: collectionsError } = useCollections();

  const approvedCollections = useMemo(
    () => (collections ?? []).filter((c) => c.status === 'approved'),
    [collections],
  );

  const balances = useMemo(() => {
    if (!expenses || !profiles) return [];
    return calculateBalances(expenses, approvedCollections, profiles);
  }, [expenses, approvedCollections, profiles]);

  return {
    balances,
    isLoading: expensesLoading || profilesLoading || collectionsLoading,
    isError: expensesError || profilesError || collectionsError,
  };
}

export function useNetBalance(userId: string): number {
  const { balances } = useBalances();
  return useMemo(() => getNetBalance(userId, balances), [userId, balances]);
}

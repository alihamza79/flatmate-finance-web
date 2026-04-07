import { useMemo } from 'react';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, isWithinInterval, min as dateMin } from 'date-fns';
import { useGroupExpenses } from './useGroupExpenses';
import { usePersonalExpenses } from './usePersonalExpenses';
import { useProfiles } from './useProfiles';
import { useBalances } from './useBalances';
import type { Profile } from '@/types';

function parseDateSafe(dateStr: string): Date {
  if (dateStr.includes('T') || dateStr.includes('Z')) return new Date(dateStr);
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export type GroupInsights = {
  totalThisMonth: number;
  topPayer: Profile | null;
  topPayerAmount: number;
  topDebtor: Profile | null;
  topDebtorAmount: number;
};

export type PersonalInsights = {
  monthlyTotal: number;
  todayTotal: number;
  dailyAverage: number;
  lastMonthTotal: number;
  percentageChange: number | null;
};

export function useGroupInsights(): GroupInsights & { isLoading: boolean } {
  const { data: expenses, isLoading: expensesLoading } = useGroupExpenses();
  const { data: profiles, isLoading: profilesLoading } = useProfiles();
  const { balances } = useBalances();

  const insights = useMemo((): GroupInsights => {
    if (!expenses || !profiles) {
      return { totalThisMonth: 0, topPayer: null, topPayerAmount: 0, topDebtor: null, topDebtorAmount: 0 };
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const thisMonthExpenses = expenses.filter((e) =>
      isWithinInterval(parseDateSafe(e.expense_date), { start: monthStart, end: monthEnd }),
    );

    const totalThisMonth = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const payerTotals = new Map<string, number>();
    for (const exp of thisMonthExpenses) {
      payerTotals.set(exp.created_by, (payerTotals.get(exp.created_by) ?? 0) + exp.amount);
    }

    let topPayerId = '';
    let topPayerAmount = 0;
    for (const [id, amount] of payerTotals) {
      if (amount > topPayerAmount) {
        topPayerAmount = amount;
        topPayerId = id;
      }
    }

    const debtTotals = new Map<string, number>();
    for (const balance of balances) {
      debtTotals.set(balance.from, (debtTotals.get(balance.from) ?? 0) + balance.amount);
    }

    let topDebtorId = '';
    let topDebtorAmount = 0;
    for (const [id, amount] of debtTotals) {
      if (amount > topDebtorAmount) {
        topDebtorAmount = amount;
        topDebtorId = id;
      }
    }

    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    return {
      totalThisMonth,
      topPayer: profileMap.get(topPayerId) ?? null,
      topPayerAmount,
      topDebtor: profileMap.get(topDebtorId) ?? null,
      topDebtorAmount,
    };
  }, [expenses, profiles, balances]);

  return { ...insights, isLoading: expensesLoading || profilesLoading };
}

export function usePersonalInsights(): PersonalInsights & { isLoading: boolean } {
  const { data: expenses, isLoading } = usePersonalExpenses();

  const insights = useMemo((): PersonalInsights => {
    if (!expenses) {
      return { monthlyTotal: 0, todayTotal: 0, dailyAverage: 0, lastMonthTotal: 0, percentageChange: null };
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthSameDay = dateMin([subMonths(now, 0), endOfMonth(subMonths(now, 1))]);

    const monthlyTotal = expenses
      .filter((e) => isWithinInterval(parseDateSafe(e.expense_date), { start: monthStart, end: monthEnd }))
      .reduce((sum, e) => sum + e.amount, 0);

    const todayTotal = expenses
      .filter((e) => isWithinInterval(parseDateSafe(e.expense_date), { start: todayStart, end: todayEnd }))
      .reduce((sum, e) => sum + e.amount, 0);

    const daysElapsed = Math.max(now.getDate(), 1);
    const dailyAverage = Math.round(monthlyTotal / daysElapsed);

    const lastMonthTotal = expenses
      .filter((e) =>
        isWithinInterval(parseDateSafe(e.expense_date), { start: lastMonthStart, end: endOfDay(lastMonthSameDay) }),
      )
      .reduce((sum, e) => sum + e.amount, 0);

    const percentageChange =
      lastMonthTotal > 0 ? Math.round(((monthlyTotal - lastMonthTotal) / lastMonthTotal) * 100) : null;

    return { monthlyTotal, todayTotal, dailyAverage, lastMonthTotal, percentageChange };
  }, [expenses]);

  return { ...insights, isLoading };
}

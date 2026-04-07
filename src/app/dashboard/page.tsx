'use client';
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Users, Wallet, RefreshCw } from 'lucide-react';
import {
  startOfMonth, endOfMonth,
  subMonths, isWithinInterval, format, parseISO,
} from 'date-fns';
import { useGroupExpenses } from '@/hooks/useGroupExpenses';
import { usePersonalExpenses } from '@/hooks/usePersonalExpenses';
import { useBalances } from '@/hooks/useBalances';
import { useAuth } from '@/store/auth';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { DateFilterBar, useDateFilter } from '@/components/ui/DateFilter';
import { formatCurrency, formatCompactAmount } from '@/lib/utils/formatCurrency';
import { supabase } from '@/lib/supabase';

function parseDateSafe(dateStr: string): Date {
  if (dateStr.includes('T') || dateStr.includes('Z')) return new Date(dateStr);
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

type TransactionItem = {
  id: string;
  description: string;
  date: string;
  amount: number;
  type: 'personal' | 'group';
  category: string | null;
};

export default function DashboardPage(): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const { data: groupExpenses, refetch: refetchGroup, isRefetching: groupRefetching } = useGroupExpenses();
  const { data: personalExpenses, refetch: refetchPersonal, isRefetching: personalRefetching } = usePersonalExpenses();
  const { balances } = useBalances();
  const dateFilter = useDateFilter('month');
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0);

  const isRefreshing = groupRefetching || personalRefetching;
  const handleRefresh = (): void => {
    void refetchGroup();
    void refetchPersonal();
  };

  const handleSignOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const totalOwed = balances.reduce((s, b) => (b.to === user?.id ? s + b.amount : s), 0);
  const totalOwe = balances.reduce((s, b) => (b.from === user?.id ? s + b.amount : s), 0);

  const filteredPersonal = useMemo(() => {
    if (!personalExpenses) return [];
    return personalExpenses.filter((e) => dateFilter.filterFn(e.expense_date));
  }, [personalExpenses, dateFilter.filterFn]);

  const filteredGroup = useMemo(() => {
    if (!groupExpenses) return [];
    return groupExpenses.filter((e) => dateFilter.filterFn(e.expense_date));
  }, [groupExpenses, dateFilter.filterFn]);

  const filteredPersonalTotal = filteredPersonal.reduce((s, e) => s + e.amount, 0);
  const filteredGroupTotal = filteredGroup.reduce((s, e) => s + e.amount, 0);

  const filteredGroupShare = useMemo(() => {
    if (!user) return 0;
    let total = 0;
    for (const expense of filteredGroup) {
      const myPart = expense.participants.find((p) => p.user_id === user.id);
      if (myPart) total += myPart.share_amount;
    }
    return total;
  }, [filteredGroup, user]);

  const filteredOutOfPocket = filteredPersonalTotal + filteredGroupShare;

  const filteredGroupCount = useMemo(() => {
    if (!user) return 0;
    return filteredGroup.filter((e) => e.participants.some((p) => p.user_id === user.id)).length;
  }, [filteredGroup, user]);

  const totalTransactionCount = filteredPersonal.length + filteredGroupCount;

  const filterDays = useMemo((): number => {
    if (dateFilter.range === 'today') return 1;
    if (dateFilter.range === '7d') return 7;
    if (dateFilter.range === 'month') return new Date().getDate();
    if (dateFilter.range === 'custom') {
      const from = dateFilter.customFrom ? parseISO(dateFilter.customFrom) : null;
      const to = dateFilter.customTo ? parseISO(dateFilter.customTo) : null;
      if (from && to) return Math.max(Math.ceil((to.getTime() - from.getTime()) / 86400000) + 1, 1);
      return 30;
    }
    const dates: number[] = [];
    if (personalExpenses && personalExpenses.length > 0) {
      dates.push(parseDateSafe(personalExpenses[personalExpenses.length - 1].expense_date).getTime());
    }
    if (groupExpenses && groupExpenses.length > 0) {
      dates.push(parseDateSafe(groupExpenses[groupExpenses.length - 1].expense_date).getTime());
    }
    if (dates.length === 0) return 1;
    const oldest = Math.min(...dates);
    return Math.max(Math.ceil((Date.now() - oldest) / 86400000), 1);
  }, [dateFilter.range, dateFilter.customFrom, dateFilter.customTo, personalExpenses, groupExpenses]);

  const dailyAverage = filterDays > 0 ? Math.round(filteredOutOfPocket / filterDays) : 0;

  const filterLabel = useMemo((): string => {
    if (dateFilter.range === 'today') return 'Today';
    if (dateFilter.range === '7d') return 'Last 7 Days';
    if (dateFilter.range === 'month') return 'This Month';
    if (dateFilter.range === 'all') return 'All Time';
    if (dateFilter.range === 'custom') {
      const parts: string[] = [];
      if (dateFilter.customFrom) parts.push(dateFilter.customFrom);
      if (dateFilter.customTo) parts.push(dateFilter.customTo);
      return parts.length > 0 ? parts.join(' – ') : 'Custom';
    }
    return '';
  }, [dateFilter.range, dateFilter.customFrom, dateFilter.customTo]);

  const monthlyData = useMemo(() => {
    if (!personalExpenses || !groupExpenses || !user) return [];
    const now = new Date();
    const months: { label: string; fullLabel: string; personalTotal: number; groupShare: number; actualTotal: number; offset: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);

      const pTotal = personalExpenses
        .filter((e) => isWithinInterval(parseDateSafe(e.expense_date), { start, end }))
        .reduce((sum, e) => sum + e.amount, 0);

      let gShare = 0;
      for (const expense of groupExpenses) {
        if (!isWithinInterval(parseDateSafe(expense.expense_date), { start, end })) continue;
        const myPart = expense.participants.find((p) => p.user_id === user.id);
        if (myPart) gShare += myPart.share_amount;
      }

      months.push({
        label: start.toLocaleDateString('en', { month: 'short' }),
        fullLabel: format(start, 'MMMM yyyy'),
        personalTotal: pTotal,
        groupShare: gShare,
        actualTotal: pTotal + gShare,
        offset: i,
      });
    }
    return months;
  }, [personalExpenses, groupExpenses, user]);

  const maxChartVal = Math.max(...monthlyData.map((m) => m.actualTotal), 1);

  const currentMonthLabel = format(new Date(), 'MMMM yyyy');
  const currentMonthTransactions = useMemo((): TransactionItem[] => {
    if (!user) return [];
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const items: TransactionItem[] = [];

    if (personalExpenses) {
      for (const e of personalExpenses) {
        if (isWithinInterval(parseDateSafe(e.expense_date), { start, end })) {
          items.push({
            id: `p-${e.id}`,
            description: e.description ?? 'Personal expense',
            date: e.expense_date,
            amount: e.amount,
            type: 'personal',
            category: e.category,
          });
        }
      }
    }

    if (groupExpenses) {
      for (const e of groupExpenses) {
        if (!isWithinInterval(parseDateSafe(e.expense_date), { start, end })) continue;
        const myPart = e.participants.find((p) => p.user_id === user.id);
        if (myPart) {
          items.push({
            id: `g-${e.id}`,
            description: e.description ?? 'Group expense',
            date: e.expense_date,
            amount: myPart.share_amount,
            type: 'group',
            category: null,
          });
        }
      }
    }

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [personalExpenses, groupExpenses, user]);

  return (
    <div className="flex-1 bg-bg min-h-screen">
      {/* Header */}
      <div className="bg-bg-card px-5 pt-12 pb-5 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Insights</h1>
            <p className="text-sm text-slate-400 mt-0.5">Spending trends & stats</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className={`text-slate-400 hover:text-white p-2 cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 bg-slate-700 px-3 py-2 rounded-xl hover:bg-slate-600 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400 font-medium">Sign out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 pb-24">
        {/* Date Filter */}
        <DateFilterBar
          range={dateFilter.range}
          setRange={dateFilter.setRange}
          customFrom={dateFilter.customFrom}
          setCustomFrom={dateFilter.setCustomFrom}
          customTo={dateFilter.customTo}
          setCustomTo={dateFilter.setCustomTo}
        />

        {/* Out of Pocket Card */}
        <div className="mb-4">
          <Card className="p-4 border-l-4 border-l-accent-amber">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-400">Out of My Pocket</span>
              <span className="bg-slate-700 px-2 py-0.5 rounded-full text-[10px] text-slate-400 font-medium">
                {filterLabel}
              </span>
            </div>
            <p className="text-white font-bold text-2xl mb-3">{formatCurrency(filteredOutOfPocket)}</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">Personal spending</span>
                <span className="text-white font-medium text-xs">{formatCurrency(filteredPersonalTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">My group share</span>
                <span className="text-white font-medium text-xs">{formatCurrency(filteredGroupShare)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mb-4">
          <div className="flex gap-3">
            <StatCard title="Transactions" value={String(totalTransactionCount)} accent="bg-primary-500" />
            <StatCard title="Daily Avg" value={formatCurrency(dailyAverage)} accent="bg-accent-cyan" />
          </div>
        </div>

        {/* Monthly Chart */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-5 bg-accent-amber rounded-full" />
            <span className="text-base font-bold text-white">Monthly Out of Pocket</span>
          </div>
          <Card className="p-4">
            <div className="flex items-end justify-between" style={{ height: 130 }}>
              {monthlyData.map((m) => {
                const barHeight = maxChartVal > 0 ? (m.actualTotal / maxChartVal) * 110 : 0;
                const isSelected = m.offset === selectedMonthOffset;
                return (
                  <button
                    key={m.label}
                    onClick={() => setSelectedMonthOffset(m.offset)}
                    className="flex flex-col items-center flex-1 cursor-pointer"
                  >
                    <span className="text-slate-400 text-[10px] mb-1">
                      {m.actualTotal > 0 ? formatCompactAmount(m.actualTotal) : ''}
                    </span>
                    <div
                      className={`w-7 rounded-t-md transition-colors ${isSelected ? 'bg-primary-500' : 'bg-slate-600 hover:bg-slate-500'}`}
                      style={{ height: Math.max(barHeight, 4) }}
                    />
                    <span className={`text-[10px] mt-1.5 ${isSelected ? 'text-primary-400 font-semibold' : 'text-slate-500'}`}>
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Group Stats */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-5 bg-primary-500 rounded-full" />
            <span className="text-base font-bold text-white">Group Overview</span>
          </div>
          <div className="flex gap-3">
            <StatCard title="Group Spend" value={formatCurrency(filteredGroupTotal)} accent="bg-primary-500" />
            <StatCard title="I Owe" value={formatCurrency(totalOwe)} accent="bg-danger" />
            <StatCard title="Owed to Me" value={formatCurrency(totalOwed)} accent="bg-success" />
          </div>
        </div>

        {/* Current Month Transactions */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 bg-accent-emerald rounded-full" />
              <span className="text-base font-bold text-white">{currentMonthLabel}</span>
            </div>
            <span className="text-slate-400 text-xs">{currentMonthTransactions.length} transactions</span>
          </div>

          {currentMonthTransactions.length > 0 ? (
            <div>
              {currentMonthTransactions.map((t) => (
                <Card key={t.id} className="p-3 mb-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 mr-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-2.5 ${t.type === 'group' ? 'bg-primary-900/40' : 'bg-purple-900/40'}`}>
                        {t.type === 'group' ? (
                          <Users className="w-3.5 h-3.5 text-primary-400" />
                        ) : (
                          <Wallet className="w-3.5 h-3.5 text-purple-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{t.description}</p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {format(new Date(t.date), 'MMM d')}
                          {t.type === 'group' ? ' · Group (my share)' : ''}
                          {t.category ? ` · ${t.category}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-white font-bold text-sm">{formatCurrency(t.amount)}</span>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-4 text-center">
              <p className="text-slate-500 text-sm">No transactions this month</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

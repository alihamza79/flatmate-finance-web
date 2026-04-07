'use client';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { Plus, RefreshCw } from 'lucide-react';
import { usePersonalExpenses } from '@/hooks/usePersonalExpenses';
import { usePersonalInsights } from '@/hooks/useInsights';
import { useBalances } from '@/hooks/useBalances';
import { useAuth } from '@/store/auth';
import { PersonalExpenseCard } from '@/components/features/PersonalExpenseCard';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ExpenseCardSkeleton } from '@/components/ui/Skeleton';
import { DateFilterBar, useDateFilter } from '@/components/ui/DateFilter';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import type { PersonalExpense } from '@/types';
import { useRouter } from 'next/navigation';

export default function PersonalPage(): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const { data: expenses, isLoading, isError, refetch } = usePersonalExpenses();
  const insights = usePersonalInsights();
  const { balances } = useBalances();
  const dateFilter = useDateFilter('month');

  const handleEdit = (expense: PersonalExpense): void => {
    router.push(`/personal/add?id=${expense.id}`);
  };

  const totalOwed = balances.reduce((s, b) => (b.to === user?.id ? s + b.amount : s), 0);
  const totalOwe = balances.reduce((s, b) => (b.from === user?.id ? s + b.amount : s), 0);

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter((e) => dateFilter.filterFn(e.expense_date));
  }, [expenses, dateFilter.filterFn]);

  return (
    <div className="flex-1 bg-bg min-h-screen">
      <div className="bg-bg-card px-5 pt-12 pb-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">My Finances</h1>
          <Link
            href="/personal/add"
            className="bg-primary-600 w-11 h-11 rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-6 h-6 text-white" />
          </Link>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Financial Summary Card */}
        <Card className="p-4 mb-5">
          <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 block">
            Financial Summary
          </span>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-sm">Personal spend (this month)</span>
              <span className="text-white font-semibold text-sm">{formatCurrency(insights.monthlyTotal)}</span>
            </div>

            {totalOwe > 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">I owe (group)</span>
                <span className="text-danger font-semibold text-sm">{formatCurrency(totalOwe)}</span>
              </div>
            ) : null}

            {totalOwed > 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">Others owe me (group)</span>
                <span className="text-success font-semibold text-sm">{formatCurrency(totalOwed)}</span>
              </div>
            ) : null}

            <div className="border-t border-slate-700/50 pt-2 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold text-sm">Group Net</span>
                {(() => {
                  const groupNet = totalOwed - totalOwe;
                  return (
                    <span className={`font-bold text-base ${groupNet >= 0 ? 'text-success' : 'text-danger'}`}>
                      {groupNet >= 0 ? '+' : ''}{formatCurrency(groupNet)}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Expenses ({filteredExpenses.length})
          </span>
          <button onClick={() => refetch()} className="text-slate-500 hover:text-slate-300 cursor-pointer">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <DateFilterBar
          range={dateFilter.range}
          setRange={dateFilter.setRange}
          customFrom={dateFilter.customFrom}
          setCustomFrom={dateFilter.setCustomFrom}
          customTo={dateFilter.customTo}
          setCustomTo={dateFilter.setCustomTo}
        />

        {isLoading ? (
          <div>
            {[1, 2, 3].map((i) => <ExpenseCardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <EmptyState icon="⚠️" title="Failed to load expenses" subtitle="Refresh to retry" />
        ) : filteredExpenses.length === 0 ? (
          <EmptyState
            icon="💰"
            title="No expenses in this period"
            subtitle="Try changing the filter or tap + to add"
          />
        ) : (
          <div>
            {filteredExpenses.map((item) => (
              <PersonalExpenseCard key={item.id} expense={item} onEdit={handleEdit} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

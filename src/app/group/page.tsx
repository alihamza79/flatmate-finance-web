'use client';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Plus, ArrowLeftRight, ChevronRight, Check, X, Clock, RefreshCw } from 'lucide-react';
import { useGroupExpenses } from '@/hooks/useGroupExpenses';
import { useBalances } from '@/hooks/useBalances';
import { useProfiles } from '@/hooks/useProfiles';
import { useCollections, useUpdateCollectionStatus } from '@/hooks/useCollections';
import { useAuth } from '@/store/auth';
import { ExpenseCard } from '@/components/features/ExpenseCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ExpenseCardSkeleton } from '@/components/ui/Skeleton';
import { DateFilterBar, useDateFilter } from '@/components/ui/DateFilter';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import type { GroupExpenseWithDetails, BalanceEntry } from '@/types';
import { useRouter } from 'next/navigation';

type UserBalance = {
  userId: string;
  name: string;
  netAmount: number;
  balanceEntries: BalanceEntry[];
};

export default function GroupPage(): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const { data: expenses, isLoading, isError, refetch } = useGroupExpenses();
  const { data: profiles } = useProfiles();
  const { balances, isLoading: balancesLoading } = useBalances();
  const { data: collections } = useCollections();
  const updateStatus = useUpdateCollectionStatus();
  const dateFilter = useDateFilter('month');

  const handleEdit = (expense: GroupExpenseWithDetails): void => {
    router.push(`/group/add?id=${expense.id}`);
  };

  const totalGroupSpend = expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0;

  const pendingForMe = useMemo(
    () => (collections ?? []).filter((c) => c.paid_to === user?.id && c.status === 'pending'),
    [collections, user?.id],
  );

  const pendingByMe = useMemo(
    () => (collections ?? []).filter((c) => c.paid_by === user?.id && c.status === 'pending'),
    [collections, user?.id],
  );

  const handleApprove = (id: string): void => {
    updateStatus.mutate({ id, status: 'approved' });
  };

  const handleReject = (id: string): void => {
    updateStatus.mutate({ id, status: 'rejected' });
  };

  const userBalances: UserBalance[] = useMemo(() => {
    if (!user || !profiles) return [];
    const others = profiles.filter((p) => p.id !== user.id);
    return others.map((person) => {
      const relevant = balances.filter(
        (b) =>
          (b.from === user.id && b.to === person.id) ||
          (b.from === person.id && b.to === user.id),
      );
      let net = 0;
      for (const b of relevant) {
        if (b.from === user.id) net -= b.amount;
        if (b.to === user.id) net += b.amount;
      }
      return {
        userId: person.id,
        name: person.full_name,
        netAmount: net,
        balanceEntries: relevant,
      };
    });
  }, [user, profiles, balances]);

  const totalOwed = userBalances.reduce((s, b) => (b.netAmount > 0 ? s + b.netAmount : s), 0);
  const totalOwe = userBalances.reduce((s, b) => (b.netAmount < 0 ? s + Math.abs(b.netAmount) : s), 0);

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter((e) => dateFilter.filterFn(e.expense_date));
  }, [expenses, dateFilter.filterFn]);

  return (
    <div className="flex-1 bg-bg min-h-screen">
      {/* Header */}
      <div className="bg-bg-card px-5 pt-12 pb-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Group</h1>
            <p className="text-sm text-slate-400">
              Total: {formatCurrency(totalGroupSpend)}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/group/collect"
              className="bg-emerald-600 w-11 h-11 rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors"
            >
              <ArrowLeftRight className="w-5 h-5 text-white" />
            </Link>
            <Link
              href="/group/add"
              className="bg-primary-600 w-11 h-11 rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-6 h-6 text-white" />
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Pending Transfers for Me */}
        {pendingForMe.length > 0 ? (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
                Pending Approval ({pendingForMe.length})
              </span>
            </div>
            {pendingForMe.map((transfer) => (
              <div
                key={transfer.id}
                className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-3.5 mb-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center flex-1">
                    <div className="w-8 h-8 bg-amber-900/40 rounded-full flex items-center justify-center mr-2.5">
                      <ArrowLeftRight className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">
                        {transfer.payer.full_name.split(' ')[0]} paid you
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {format(new Date(transfer.collection_date), 'MMM d')}
                        {transfer.description ? ` · ${transfer.description}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-amber-300 font-bold text-base">
                    {formatCurrency(transfer.amount)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(transfer.id)}
                    className="flex-1 bg-emerald-600 rounded-lg py-2 flex items-center justify-center gap-1.5 hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-white" />
                    <span className="text-white font-semibold text-sm">Approve</span>
                  </button>
                  <button
                    onClick={() => handleReject(transfer.id)}
                    className="flex-1 bg-red-800/60 rounded-lg py-2 flex items-center justify-center gap-1.5 hover:bg-red-800/80 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 text-danger" />
                    <span className="text-danger font-semibold text-sm">Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* My Pending Transfers */}
        {pendingByMe.length > 0 ? (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Awaiting Confirmation ({pendingByMe.length})
              </span>
            </div>
            {pendingByMe.map((transfer) => (
              <div
                key={transfer.id}
                className="bg-bg-card border border-slate-700/50 rounded-xl p-3.5 mb-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center mr-2.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-300 font-medium text-sm">
                        You paid {transfer.receiver.full_name.split(' ')[0]}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {format(new Date(transfer.collection_date), 'MMM d')}
                        {transfer.description ? ` · ${transfer.description}` : ''} · Pending
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-400 font-bold text-sm">
                    {formatCurrency(transfer.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Balance Cards */}
        <div className="mb-5">
          <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 block">
            Balances
          </span>

          {!balancesLoading && userBalances.every((b) => b.netAmount === 0) ? (
            <div className="bg-emerald-900/30 rounded-2xl p-5 text-center">
              <span className="text-3xl mb-2 block">✅</span>
              <p className="text-success font-semibold text-base">All settled up!</p>
              <p className="text-slate-500 text-xs mt-1">No outstanding balances</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {(totalOwed > 0 || totalOwe > 0) ? (
                <div className="flex gap-3 mb-1">
                  {totalOwe > 0 ? (
                    <div className="flex-1 bg-red-900/30 rounded-xl px-3 py-2.5">
                      <p className="text-xs text-slate-400">You owe</p>
                      <p className="text-danger font-bold text-base">{formatCurrency(totalOwe)}</p>
                    </div>
                  ) : null}
                  {totalOwed > 0 ? (
                    <div className="flex-1 bg-emerald-900/30 rounded-xl px-3 py-2.5">
                      <p className="text-xs text-slate-400">You&apos;re owed</p>
                      <p className="text-success font-bold text-base">{formatCurrency(totalOwed)}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {userBalances
                .filter((b) => b.netAmount !== 0)
                .sort((a, b) => Math.abs(b.netAmount) - Math.abs(a.netAmount))
                .map((b) => {
                  const isOwed = b.netAmount > 0;
                  return (
                    <Link
                      key={b.userId}
                      href={`/group/detail?userId=${b.userId}&name=${encodeURIComponent(b.name)}`}
                      className={`bg-bg-card rounded-xl p-4 flex items-center justify-between border-l-4 hover:bg-bg-elevated transition-colors ${isOwed ? 'border-l-success' : 'border-l-danger'}`}
                    >
                      <div className="flex items-center flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${isOwed ? 'bg-emerald-900/40' : 'bg-red-900/40'}`}>
                          <span className="text-base font-bold text-slate-300">
                            {b.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{b.name.split(' ')[0]}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {isOwed ? 'owes you' : 'you owe'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`font-bold text-base mr-2 ${isOwed ? 'text-success' : 'text-danger'}`}>
                          {formatCurrency(Math.abs(b.netAmount))}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </Link>
                  );
                })}
            </div>
          )}
        </div>

        {/* Expenses Header + Filter */}
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
          <EmptyState icon="⚠️" title="Failed to load" subtitle="Refresh to retry" />
        ) : filteredExpenses.length === 0 ? (
          <EmptyState
            icon="💸"
            title="No expenses in this period"
            subtitle="Try changing the filter or tap + to add"
          />
        ) : (
          <div>
            {filteredExpenses.map((item) => (
              <ExpenseCard key={item.id} expense={item} onEdit={handleEdit} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';
import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, ArrowLeftRight, Check, X } from 'lucide-react';
import { useGroupExpenses } from '@/hooks/useGroupExpenses';
import { useCollections, useUpdateCollectionStatus } from '@/hooks/useCollections';
import { useBalances } from '@/hooks/useBalances';
import { useAuth } from '@/store/auth';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/formatCurrency';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-amber-900/30', text: 'text-amber-400', label: 'Pending' },
  approved: { bg: 'bg-emerald-900/30', text: 'text-success', label: 'Approved' },
  rejected: { bg: 'bg-red-900/30', text: 'text-danger', label: 'Rejected' },
};

export default function BalanceDetailPage(): React.JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId') ?? '';
  const name = searchParams.get('name') ?? 'User';
  const { user } = useAuth();
  const { data: expenses } = useGroupExpenses();
  const { data: collections } = useCollections();
  const { balances } = useBalances();
  const updateStatus = useUpdateCollectionStatus();

  const relevantBalances = balances.filter(
    (b) =>
      (b.from === user?.id && b.to === userId) ||
      (b.from === userId && b.to === user?.id),
  );

  let netAmount = 0;
  for (const b of relevantBalances) {
    if (b.from === user?.id) netAmount -= b.amount;
    if (b.to === user?.id) netAmount += b.amount;
  }

  const isOwed = netAmount > 0;
  const firstName = name.split(' ')[0];

  const relatedExpenses = (expenses ?? []).filter((e) => {
    const paidByMe = e.created_by === user?.id;
    const paidByThem = e.created_by === userId;
    if (!paidByMe && !paidByThem) return false;
    const participantIds = e.participants.map((p) => p.user_id);
    if (paidByMe) return participantIds.includes(userId);
    return participantIds.includes(user?.id ?? '');
  });

  const relatedCollections = (collections ?? []).filter(
    (c) =>
      (c.paid_by === user?.id && c.paid_to === userId) ||
      (c.paid_by === userId && c.paid_to === user?.id),
  );

  const handleApprove = (id: string): void => {
    updateStatus.mutate({ id, status: 'approved' });
  };

  const handleReject = (id: string): void => {
    updateStatus.mutate({ id, status: 'rejected' });
  };

  return (
    <div className="bg-bg min-h-screen">
      <div className="bg-bg-card px-5 pt-12 pb-4 border-b border-slate-700/50 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-white">{name}</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {/* Net Balance Summary */}
        <div className={`rounded-2xl p-6 flex flex-col items-center mb-6 ${netAmount === 0 ? 'bg-emerald-900/30' : isOwed ? 'bg-emerald-900/20' : 'bg-red-900/20'}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${netAmount === 0 ? 'bg-emerald-900/40' : isOwed ? 'bg-emerald-900/40' : 'bg-red-900/40'}`}>
            <span className="text-2xl font-bold text-white">{firstName.charAt(0)}</span>
          </div>
          <p className="text-white font-bold text-lg mb-1">{name}</p>
          {netAmount === 0 ? (
            <p className="text-success font-semibold">All settled up!</p>
          ) : (
            <>
              <p className={`text-2xl font-bold ${isOwed ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(Math.abs(netAmount))}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {isOwed ? `${firstName} owes you` : `You owe ${firstName}`}
              </p>
            </>
          )}
        </div>

        {/* Expenses Breakdown */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-5 bg-primary-500 rounded-full" />
            <span className="text-base font-bold text-white">
              Shared Expenses ({relatedExpenses.length})
            </span>
          </div>

          {relatedExpenses.length === 0 ? (
            <Card className="p-4 text-center">
              <p className="text-slate-400 text-sm">No shared expenses yet</p>
            </Card>
          ) : (
            relatedExpenses.map((expense) => {
              const myShare = expense.participants.find((p) => p.user_id === user?.id)?.share_amount ?? 0;
              const theirShare = expense.participants.find((p) => p.user_id === userId)?.share_amount ?? 0;
              const iPaid = expense.created_by === user?.id;
              const paidByName = iPaid
                ? 'you'
                : expense.creator?.full_name?.split(' ')[0] ?? firstName;

              return (
                <Card key={expense.id} className="p-3.5 mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-3">
                      <p className="text-white font-medium text-sm truncate">
                        {expense.description || 'Expense'}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {format(new Date(expense.expense_date), 'MMM d')} · Paid by {paidByName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-sm">{formatCurrency(expense.amount)}</p>
                      <p className={`text-xs mt-0.5 ${iPaid ? 'text-success' : 'text-danger'}`}>
                        {iPaid ? `${firstName}: ${formatCurrency(theirShare)}` : `You: ${formatCurrency(myShare)}`}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Transfers */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-5 bg-accent-emerald rounded-full" />
            <span className="text-base font-bold text-white">
              Transfers ({relatedCollections.length})
            </span>
          </div>

          {relatedCollections.length === 0 ? (
            <Card className="p-4 text-center">
              <p className="text-slate-400 text-sm">No transfers recorded yet</p>
            </Card>
          ) : (
            relatedCollections.map((col) => {
              const iPaid = col.paid_by === user?.id;
              const style = STATUS_STYLES[col.status] ?? STATUS_STYLES.pending;
              const canApprove = col.paid_to === user?.id && col.status === 'pending';

              return (
                <Card key={col.id} className="p-3.5 mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="w-8 h-8 bg-emerald-900/40 rounded-full flex items-center justify-center mr-3">
                        <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">
                          {iPaid ? `You paid ${firstName}` : `${firstName} paid you`}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-slate-500 text-xs">
                            {format(new Date(col.collection_date), 'MMM d, yyyy')}
                            {col.description ? ` · ${col.description}` : ''}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${style.bg} ${style.text}`}>
                            {style.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`font-bold text-sm ${iPaid ? 'text-danger' : 'text-success'}`}>
                      {formatCurrency(col.amount)}
                    </span>
                  </div>

                  {canApprove ? (
                    <div className="flex gap-2 mt-2.5">
                      <button
                        onClick={() => handleApprove(col.id)}
                        className="flex-1 bg-emerald-600 rounded-lg py-1.5 flex items-center justify-center gap-1 hover:bg-emerald-700 transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span className="text-white font-semibold text-xs">Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(col.id)}
                        className="flex-1 bg-red-800/60 rounded-lg py-1.5 flex items-center justify-center gap-1 hover:bg-red-800/80 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5 text-danger" />
                        <span className="text-danger font-semibold text-xs">Reject</span>
                      </button>
                    </div>
                  ) : null}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

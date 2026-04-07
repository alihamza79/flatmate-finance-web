'use client';
import React from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { useDeleteGroupExpense } from '@/hooks/useGroupExpenses';
import { useAuth } from '@/store/auth';
import type { GroupExpenseWithDetails } from '@/types';

type ExpenseCardProps = {
  expense: GroupExpenseWithDetails;
  onEdit: (expense: GroupExpenseWithDetails) => void;
};

export function ExpenseCard({ expense, onEdit }: ExpenseCardProps): React.JSX.Element {
  const { user } = useAuth();
  const deleteExpense = useDeleteGroupExpense();
  const isOwner = user?.id === expense.created_by;
  const paidByMe = expense.created_by === user?.id;
  const payerFirstName = expense.creator.full_name.split(' ')[0];

  const handleDelete = (): void => {
    if (confirm('Delete this expense?')) {
      deleteExpense.mutate(expense.id);
    }
  };

  return (
    <Card className="p-4 mb-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 mr-3">
          <p className="text-base font-semibold text-white truncate">
            {expense.description ?? 'Expense'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {paidByMe ? 'You paid' : `${payerFirstName} paid`} · {format(new Date(expense.expense_date), 'MMM d, yyyy')}
            {expense.split_type === 'custom' ? ' · Custom split' : ''}
          </p>
        </div>
        <span className="text-lg font-bold text-white">
          {formatCurrency(expense.amount)}
        </span>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
        {expense.participants.map((p) => {
          const isMe = p.user_id === user?.id;
          const isPayer = p.user_id === expense.created_by;
          const firstName = p.profile.full_name.split(' ')[0];

          return (
            <div key={p.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isMe ? 'bg-primary-900/50' : 'bg-slate-700'}`}>
                  <span className={`text-xs font-bold ${isMe ? 'text-primary-300' : 'text-slate-400'}`}>
                    {firstName.charAt(0)}
                  </span>
                </div>
                <span className={`text-sm ${isMe ? 'text-white font-medium' : 'text-slate-300'}`}>
                  {isMe ? 'You' : firstName}
                </span>
                {isPayer ? (
                  <span className="bg-emerald-900/30 px-1.5 py-0.5 rounded text-[10px] text-emerald-400 font-medium">
                    paid
                  </span>
                ) : null}
              </div>
              <span className={`text-sm font-semibold ${isMe ? 'text-white' : 'text-slate-400'}`}>
                {formatCurrency(p.share_amount)}
              </span>
            </div>
          );
        })}
      </div>

      {isOwner ? (
        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50">
          <button
            onClick={() => onEdit(expense)}
            className="flex items-center gap-1.5 bg-primary-900/30 px-3 py-1.5 rounded-lg hover:bg-primary-900/50 transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-primary-400" />
            <span className="text-xs text-primary-400 font-medium">Edit</span>
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 bg-red-900/30 px-3 py-1.5 rounded-lg hover:bg-red-900/50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-danger" />
            <span className="text-xs text-danger font-medium">Delete</span>
          </button>
        </div>
      ) : null}
    </Card>
  );
}

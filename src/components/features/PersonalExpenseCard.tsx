'use client';
import React from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { useDeletePersonalExpense } from '@/hooks/usePersonalExpenses';
import type { PersonalExpense } from '@/types';

type PersonalExpenseCardProps = {
  expense: PersonalExpense;
  onEdit: (expense: PersonalExpense) => void;
};

export function PersonalExpenseCard({ expense, onEdit }: PersonalExpenseCardProps): React.JSX.Element {
  const deleteExpense = useDeletePersonalExpense();

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
            {format(new Date(expense.expense_date), 'MMM d, yyyy')}
          </p>
          {expense.category ? (
            <div className="mt-2">
              <Badge label={expense.category} variant="neutral" />
            </div>
          ) : null}
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-white">
            {formatCurrency(expense.amount)}
          </span>
        </div>
      </div>

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
    </Card>
  );
}

'use client';
import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS, EXPENSE_CATEGORIES } from '@/config/constants';
import { personalExpenseSchema, type PersonalExpenseFormData } from '@/lib/validations/personalExpenseSchema';
import { useCreatePersonalExpense, useUpdatePersonalExpense, usePersonalExpenses } from '@/hooks/usePersonalExpenses';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function AddPersonalExpensePage(): React.JSX.Element {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') ?? undefined;
  const isEditing = Boolean(id);
  const router = useRouter();
  const { data: expenses } = usePersonalExpenses();
  const createExpense = useCreatePersonalExpense();
  const updateExpense = useUpdatePersonalExpense();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const existingExpense = isEditing ? expenses?.find((e) => e.id === id) : undefined;

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PersonalExpenseFormData>({
    resolver: zodResolver(personalExpenseSchema),
    defaultValues: {
      amount: '',
      description: '',
      category: '',
      expense_date: format(new Date(), 'yyyy-MM-dd'),
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    if (existingExpense) {
      reset({
        amount: String(existingExpense.amount),
        description: existingExpense.description ?? '',
        category: existingExpense.category ?? '',
        expense_date: existingExpense.expense_date,
      });
      setSelectedCategory(existingExpense.category ?? null);
    }
  }, [existingExpense, reset]);

  const onSubmit = async (data: PersonalExpenseFormData): Promise<void> => {
    try {
      const payload = {
        amount: Number(data.amount),
        description: data.description ?? null,
        category: data.category ?? selectedCategory ?? null,
        expense_date: data.expense_date,
      };

      if (isEditing && id) {
        await updateExpense.mutateAsync({ id, ...payload });
      } else {
        await createExpense.mutateAsync(payload);
      }
      await queryClient.refetchQueries({ queryKey: QUERY_KEYS.personalExpenses });
      router.back();
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'Failed to save' });
    }
  };

  return (
    <div className="bg-bg min-h-screen">
      <div className="bg-bg-card px-5 pt-12 pb-4 border-b border-slate-700/50 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-white">{isEditing ? 'Edit Expense' : 'Add Personal Expense'}</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {errors.root ? (
          <div className="bg-red-900/30 rounded-xl p-3 mb-4">
            <p className="text-danger text-sm text-center">{errors.root.message}</p>
          </div>
        ) : null}

        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Amount (PKR)"
              placeholder="0"
              type="number"
              prefix="PKR"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              error={errors.amount?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Description (optional)"
              placeholder="e.g. Lunch, Uber..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              error={errors.description?.message}
            />
          )}
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">Category (optional)</label>
          <div className="flex flex-wrap gap-2">
            {EXPENSE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  const newCat = selectedCategory === cat ? null : cat;
                  setSelectedCategory(newCat);
                  setValue('category', newCat ?? '');
                }}
                className={`px-3 py-2 rounded-full border transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-bg-card border-slate-600 text-slate-300 hover:border-slate-500'
                }`}
              >
                <span className="text-sm font-medium">{cat}</span>
              </button>
            ))}
          </div>
        </div>

        <Controller
          control={control}
          name="expense_date"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Date"
              type="date"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              error={errors.expense_date?.message}
            />
          )}
        />

        <Button
          label={isEditing ? 'Update Expense' : 'Add Expense'}
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting}
          fullWidth
          size="lg"
        />
      </div>
    </div>
  );
}

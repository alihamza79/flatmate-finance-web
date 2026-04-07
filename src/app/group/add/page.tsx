'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Check, ArrowLeft } from 'lucide-react';
import { groupExpenseSchema, type GroupExpenseFormData } from '@/lib/validations/groupExpenseSchema';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/constants';
import { useCreateGroupExpense, useUpdateGroupExpense, useGroupExpenses } from '@/hooks/useGroupExpenses';
import { useProfiles } from '@/hooks/useProfiles';
import { useAuth } from '@/store/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils/formatCurrency';

export default function AddGroupExpensePage(): React.JSX.Element {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') ?? undefined;
  const isEditing = Boolean(id);
  const router = useRouter();
  const { user } = useAuth();
  const { data: profiles } = useProfiles();
  const { data: expenses } = useGroupExpenses();
  const createExpense = useCreateGroupExpense();
  const updateExpense = useUpdateGroupExpense();
  const queryClient = useQueryClient();

  const existingExpense = isEditing ? expenses?.find((e) => e.id === id) : undefined;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GroupExpenseFormData>({
    resolver: zodResolver(groupExpenseSchema),
    defaultValues: {
      amount: '',
      description: '',
      split_type: 'equal',
      expense_date: format(new Date(), 'yyyy-MM-dd'),
      participants: [],
      custom_split: [],
    },
    mode: 'onBlur',
  });

  const { fields: customSplitFields, replace: replaceCustomSplit } = useFieldArray({
    control,
    name: 'custom_split',
  });

  const splitType = watch('split_type');
  const watchedCustomSplit = watch('custom_split');
  const amount = watch('amount');

  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [payerIncluded, setPayerIncluded] = useState(true);

  const totalAmount = Number(amount) || 0;
  const splitCount = selectedParticipants.size + (payerIncluded ? 1 : 0);

  const othersAssigned = (watchedCustomSplit ?? []).reduce(
    (sum, s) => sum + (Number(s?.amount) || 0),
    0,
  );
  const remaining = Math.max(0, totalAmount - othersAssigned);

  useEffect(() => {
    if (existingExpense && user) {
      const participantIds = existingExpense.participants.map((p) => p.user_id);
      const otherIds = participantIds.filter((uid) => uid !== user.id);
      const payerIsParticipant = participantIds.includes(user.id);

      reset({
        amount: String(existingExpense.amount),
        description: existingExpense.description ?? '',
        split_type: existingExpense.split_type,
        expense_date: existingExpense.expense_date,
        participants: otherIds,
        custom_split: existingExpense.participants
          .filter((p) => p.user_id !== user.id)
          .map((p) => ({
            user_id: p.user_id,
            amount: String(p.share_amount),
          })),
      });
      setSelectedParticipants(new Set(otherIds));
      setPayerIncluded(payerIsParticipant);
    }
  }, [existingExpense, reset, user]);

  const toggleParticipant = (userId: string): void => {
    const newSet = new Set(selectedParticipants);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedParticipants(newSet);
    const arr = Array.from(newSet);
    setValue('participants', arr, { shouldValidate: true });

    if (splitType === 'custom') {
      replaceCustomSplit(
        arr.map((uid) => {
          const existing = customSplitFields.find((f) => f.user_id === uid);
          return { user_id: uid, amount: existing?.amount ?? '' };
        }),
      );
    }
  };

  const handleCustomAmountChange = useCallback(
    (index: number, rawValue: string): void => {
      const numVal = Number(rawValue) || 0;
      const currentFieldVal = Number(watchedCustomSplit?.[index]?.amount) || 0;
      const available = totalAmount - (othersAssigned - currentFieldVal);
      const clamped = Math.min(numVal, Math.max(0, available));
      setValue(`custom_split.${index}.amount`, String(clamped > 0 ? clamped : rawValue === '' ? '' : clamped));
    },
    [totalAmount, othersAssigned, watchedCustomSplit, setValue],
  );

  const onSubmit = async (data: GroupExpenseFormData): Promise<void> => {
    try {
      if (!user) throw new Error('Not authenticated');

      if (splitCount === 0) {
        setError('participants', { message: 'At least one person must be in the split' });
        return;
      }

      const total = Math.round(Number(data.amount) * 100) / 100;
      let participantsPayload: { user_id: string; share_amount: number }[];

      if (data.split_type === 'equal') {
        const allIds = [...(payerIncluded ? [user.id] : []), ...data.participants];
        const totalPaisa = Math.round(total * 100);
        const basePaisa = Math.floor(totalPaisa / allIds.length);
        const remainderPaisa = totalPaisa - basePaisa * allIds.length;
        participantsPayload = allIds.map((uid, idx) => ({
          user_id: uid,
          share_amount: (idx < remainderPaisa ? basePaisa + 1 : basePaisa) / 100,
        }));
      } else {
        const othersPayload = (data.custom_split ?? [])
          .filter((s) => Number(s.amount) > 0)
          .map((s) => ({
            user_id: s.user_id,
            share_amount: Math.round(Number(s.amount) * 100) / 100,
          }));
        const othersSum = Math.round(othersPayload.reduce((s, p) => s + p.share_amount, 0) * 100) / 100;

        if (payerIncluded) {
          const payerShare = Math.round((total - othersSum) * 100) / 100;
          if (payerShare < 0) {
            setError('root', { message: 'Participant shares exceed the total amount' });
            return;
          }
          participantsPayload = [
            ...(payerShare > 0 ? [{ user_id: user.id, share_amount: payerShare }] : []),
            ...othersPayload,
          ];
        } else {
          if (Math.abs(othersSum - total) > 0.01) {
            setError('root', {
              message: `Shares must equal the total. Currently ${formatCurrency(othersSum)} of ${formatCurrency(total)} assigned.`,
            });
            return;
          }
          participantsPayload = othersPayload;
        }
      }

      const sharesTotal = Math.round(participantsPayload.reduce((s, p) => s + p.share_amount, 0) * 100) / 100;
      if (Math.abs(sharesTotal - total) > 0.01) {
        setError('root', { message: 'Split amounts do not add up to the total. Please adjust.' });
        return;
      }

      if (participantsPayload.length === 0 || participantsPayload.every((p) => p.share_amount <= 0)) {
        setError('root', { message: 'Each participant must have a share greater than 0' });
        return;
      }

      if (isEditing && id) {
        await updateExpense.mutateAsync({
          id,
          amount: total,
          description: data.description ?? null,
          split_type: data.split_type,
          expense_date: data.expense_date,
          participants: participantsPayload,
        });
      } else {
        await createExpense.mutateAsync({
          amount: total,
          description: data.description ?? null,
          split_type: data.split_type,
          expense_date: data.expense_date,
          participants: participantsPayload,
        });
      }

      await queryClient.refetchQueries({ queryKey: QUERY_KEYS.groupExpenses });
      router.back();
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'Failed to save' });
    }
  };

  const otherProfiles = profiles?.filter((p) => p.id !== user?.id) ?? [];

  const equalSharePreview = useMemo(() => {
    if (splitCount <= 0 || totalAmount <= 0) return { base: 0, rem: 0 };
    const totalPaisa = Math.round(totalAmount * 100);
    const basePaisa = Math.floor(totalPaisa / splitCount);
    const rem = totalPaisa - basePaisa * splitCount;
    return { base: basePaisa / 100, rem };
  }, [totalAmount, splitCount]);

  return (
    <div className="bg-bg min-h-screen">
      <div className="bg-bg-card px-5 pt-12 pb-4 border-b border-slate-700/50 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-white">{isEditing ? 'Edit Expense' : 'Add Group Expense'}</h1>
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
              placeholder="e.g. Dinner, Groceries..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              error={errors.description?.message}
            />
          )}
        />

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

        {/* Split Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Split Type</label>
          <div className="flex gap-3">
            {(['equal', 'custom'] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setValue('split_type', type);
                  if (type === 'custom') {
                    const arr = Array.from(selectedParticipants);
                    replaceCustomSplit(
                      arr.map((uid) => ({ user_id: uid, amount: '' })),
                    );
                  }
                }}
                className={`flex-1 py-3 rounded-xl text-center border-2 font-semibold text-sm capitalize transition-colors cursor-pointer ${
                  splitType === type
                    ? 'border-primary-500 bg-primary-900/30 text-primary-400'
                    : 'border-slate-600 bg-bg-card text-slate-400 hover:border-slate-500'
                }`}
              >
                {type === 'equal' ? '⚖️ Equal' : '✏️ Custom'}
              </button>
            ))}
          </div>
        </div>

        {/* Participants */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Who&apos;s splitting this?</label>
          <p className="text-xs text-slate-500 mb-2.5">You are the payer. Tap yourself to include/exclude from the split.</p>
          {errors.participants ? (
            <p className="text-danger text-xs mb-2">{errors.participants.message}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPayerIncluded((prev) => !prev)}
              className={`flex items-center rounded-full px-4 py-2 border-2 transition-colors cursor-pointer ${
                payerIncluded
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : 'bg-bg-card border-slate-600 text-primary-400'
              }`}
            >
              <span className="text-sm font-semibold">You</span>
              {payerIncluded ? <Check className="w-3.5 h-3.5 ml-1.5" /> : null}
            </button>

            {otherProfiles.map((profile) => {
              const isSelected = selectedParticipants.has(profile.id);
              return (
                <button
                  key={profile.id}
                  onClick={() => toggleParticipant(profile.id)}
                  className={`flex items-center rounded-full px-4 py-2 border-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-200 border-slate-200 text-slate-900'
                      : 'bg-bg-card border-slate-600 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className="text-sm font-medium">{profile.full_name.split(' ')[0]}</span>
                  {isSelected ? <Check className="w-3.5 h-3.5 ml-1.5 text-slate-900" /> : null}
                </button>
              );
            })}
          </div>

          {splitType === 'equal' && splitCount > 0 && totalAmount > 0 ? (
            <div className="bg-primary-900/30 rounded-xl px-4 py-2.5 mt-3">
              <p className="text-xs text-primary-400 text-center">
                {formatCurrency(equalSharePreview.base)} each x {splitCount} {splitCount === 1 ? 'person' : 'people'}
                {equalSharePreview.rem > 0 ? ` (+0.01 to ${equalSharePreview.rem} ${equalSharePreview.rem === 1 ? 'person' : 'people'})` : ''}
              </p>
            </div>
          ) : null}

          {splitCount === 0 ? (
            <div className="bg-amber-900/30 rounded-xl px-4 py-2.5 mt-3">
              <p className="text-xs text-warning text-center">Select at least one person to split with</p>
            </div>
          ) : null}
        </div>

        {/* Custom Split Inputs */}
        {splitType === 'custom' && selectedParticipants.size > 0 ? (
          <div className="mb-4">
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-medium text-slate-300">Custom Split</span>
                <span className={`text-xs font-semibold ${othersAssigned > totalAmount ? 'text-danger' : othersAssigned === totalAmount && !payerIncluded ? 'text-success' : 'text-slate-400'}`}>
                  {formatCurrency(othersAssigned)} / {formatCurrency(totalAmount)}
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${othersAssigned > totalAmount ? 'bg-danger' : 'bg-primary-500'}`}
                  style={{ width: `${Math.min(100, totalAmount > 0 ? (othersAssigned / totalAmount) * 100 : 0)}%` }}
                />
              </div>
            </div>

            {payerIncluded ? (
              <div className={`flex items-center rounded-xl px-4 py-3 mb-3 ${remaining > 0 ? 'bg-primary-900/20 border border-primary-800' : 'bg-bg-card border border-slate-700'}`}>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${remaining > 0 ? 'text-primary-300' : 'text-slate-500'}`}>
                    You (auto-remainder)
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Gets whatever is left after others</p>
                </div>
                <span className={`text-lg font-bold ${remaining > 0 ? 'text-primary-300' : 'text-slate-500'}`}>
                  {formatCurrency(remaining)}
                </span>
              </div>
            ) : null}

            {customSplitFields.map((field, index) => {
              const profile = profiles?.find((p) => p.id === field.user_id);
              const currentVal = Number(watchedCustomSplit?.[index]?.amount) || 0;
              const maxForThisField = totalAmount - (othersAssigned - currentVal);

              return (
                <div key={field.id} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-300">{profile?.full_name ?? 'User'}</span>
                    <span className="text-xs text-slate-500">max {formatCurrency(Math.max(0, maxForThisField))}</span>
                  </div>
                  <Controller
                    control={control}
                    name={`custom_split.${index}.amount`}
                    render={({ field: { onBlur, value } }) => (
                      <div className="flex items-center bg-bg-input border border-slate-600 rounded-xl px-4 py-3">
                        <span className="text-slate-400 mr-2 text-base">PKR</span>
                        <input
                          className="flex-1 text-base text-slate-100 bg-transparent outline-none"
                          placeholder="0"
                          type="number"
                          value={value}
                          onChange={(e) => handleCustomAmountChange(index, e.target.value)}
                          onBlur={onBlur}
                        />
                      </div>
                    )}
                  />
                </div>
              );
            })}

            {!payerIncluded && othersAssigned > 0 && othersAssigned < totalAmount ? (
              <div className="bg-amber-900/30 rounded-xl px-4 py-2.5 mt-1">
                <p className="text-xs text-warning text-center">
                  {formatCurrency(totalAmount - othersAssigned)} unassigned — assign it or include yourself in the split
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <Button
          label={isEditing ? 'Update Expense' : 'Add Expense'}
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting}
          disabled={splitCount === 0}
          fullWidth
          size="lg"
        />
      </div>
    </div>
  );
}

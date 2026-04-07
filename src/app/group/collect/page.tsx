'use client';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Check, Info } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/constants';
import { collectionSchema, type CollectionFormData } from '@/lib/validations/collectionSchema';
import { useCreateCollection } from '@/hooks/useCollections';
import { useProfiles } from '@/hooks/useProfiles';
import { useAuth } from '@/store/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function CollectPage(): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const { data: profiles } = useProfiles();
  const createCollection = useCreateCollection();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      paid_by: user?.id ?? '',
      paid_to: '',
      amount: '',
      description: '',
      collection_date: format(new Date(), 'yyyy-MM-dd'),
    },
    mode: 'onBlur',
  });

  const selectedPerson = watch('paid_to');

  const selectPerson = (profileId: string): void => {
    setValue('paid_to', profileId, { shouldValidate: true });
  };

  const onSubmit = async (data: CollectionFormData): Promise<void> => {
    try {
      await createCollection.mutateAsync({
        paid_to: data.paid_to,
        amount: Number(data.amount),
        description: data.description ?? null,
        collection_date: data.collection_date,
      });

      await Promise.all([
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.collections }),
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.groupExpenses }),
      ]);
      router.back();
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'Failed to save' });
    }
  };

  const otherProfiles = profiles?.filter((p) => p.id !== user?.id) ?? [];

  return (
    <div className="bg-bg min-h-screen">
      <div className="bg-bg-card px-5 pt-12 pb-4 border-b border-slate-700/50 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-white">Record Payment</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {errors.root ? (
          <div className="bg-red-900/30 rounded-xl p-3 mb-4">
            <p className="text-danger text-sm text-center">{errors.root.message}</p>
          </div>
        ) : null}

        <div className="rounded-xl p-3 mb-5 flex items-start bg-primary-900/20">
          <Info className="w-4 h-4 text-primary-400 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-slate-300 text-xs flex-1">
            Record a payment you made to someone. It will be pending until they approve it, then balances update automatically.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">Who did you pay?</label>
          {errors.paid_to ? (
            <p className="text-danger text-xs mb-2">{errors.paid_to.message}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {otherProfiles.map((profile) => {
              const isSelected = selectedPerson === profile.id;
              return (
                <button
                  key={profile.id}
                  onClick={() => selectPerson(profile.id)}
                  className={`flex items-center rounded-full px-4 py-2.5 border-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-bg-card border-slate-600 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-2 ${isSelected ? 'bg-primary-700' : 'bg-slate-700'}`}>
                    <span className="text-xs font-bold text-white">{profile.full_name.charAt(0)}</span>
                  </div>
                  <span className="text-sm font-medium">{profile.full_name.split(' ')[0]}</span>
                  {isSelected ? <Check className="w-3.5 h-3.5 ml-1.5" /> : null}
                </button>
              );
            })}
          </div>
        </div>

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
              label="Note (optional)"
              placeholder="e.g. Cash payment, bank transfer, advance..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              error={errors.description?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="collection_date"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Date"
              type="date"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              error={errors.collection_date?.message}
            />
          )}
        />

        <Button
          label="Record Payment"
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting}
          disabled={!selectedPerson}
          fullWidth
          size="lg"
        />
      </div>
    </div>
  );
}

import { supabase } from '@/lib/supabase';
import type { CollectionWithProfiles, CollectionStatus } from '@/types';

export async function fetchCollections(): Promise<CollectionWithProfiles[]> {
  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      payer:profiles!collections_paid_by_fkey(*),
      receiver:profiles!collections_paid_to_fkey(*)
    `)
    .order('collection_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as CollectionWithProfiles[];
}

export type CreateCollectionInput = {
  paid_to: string;
  amount: number;
  description: string | null;
  collection_date: string;
};

export async function createCollection(input: CreateCollectionInput): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  if (input.amount <= 0) throw new Error('Amount must be positive');
  if (input.paid_to === user.id) throw new Error('Cannot record a payment to yourself');

  const { error } = await supabase.from('collections').insert({
    paid_by: user.id,
    paid_to: input.paid_to,
    amount: Math.round(input.amount * 100) / 100,
    description: input.description,
    collection_date: input.collection_date,
    created_by: user.id,
    status: 'pending',
  });

  if (error) throw new Error(error.message);
}

export async function updateCollectionStatus(id: string, status: CollectionStatus): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: collection, error: fetchError } = await supabase
    .from('collections')
    .select('paid_to, status')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  if (!collection) throw new Error('Collection not found');
  if (collection.paid_to !== user.id) throw new Error('Only the recipient can approve or reject');
  if (collection.status !== 'pending') throw new Error('Can only update pending transfers');

  const { error } = await supabase
    .from('collections')
    .update({ status })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function deleteCollection(id: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: collection, error: fetchError } = await supabase
    .from('collections')
    .select('created_by, status')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  if (!collection) throw new Error('Collection not found');
  if (collection.created_by !== user.id) throw new Error('Only the creator can delete this');
  if (collection.status === 'approved') throw new Error('Cannot delete an approved transfer');

  const { error } = await supabase.from('collections').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

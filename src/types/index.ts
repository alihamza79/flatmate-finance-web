export type SplitType = 'equal' | 'custom';

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
};

export type GroupExpense = {
  id: string;
  created_by: string;
  amount: number;
  description: string | null;
  split_type: SplitType;
  expense_date: string;
  created_at: string;
};

export type ExpenseParticipant = {
  id: string;
  expense_id: string;
  user_id: string;
  share_amount: number;
};

export type PersonalExpense = {
  id: string;
  user_id: string;
  amount: number;
  description: string | null;
  category: string | null;
  expense_date: string;
  created_at: string;
};

export type GroupExpenseWithDetails = GroupExpense & {
  creator: Profile;
  participants: (ExpenseParticipant & { profile: Profile })[];
};

export type BalanceEntry = {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
  expenseIds: string[];
};

export type CollectionStatus = 'pending' | 'approved' | 'rejected';

export type Collection = {
  id: string;
  paid_by: string;
  paid_to: string;
  amount: number;
  description: string | null;
  collection_date: string;
  created_by: string;
  status: CollectionStatus;
  created_at: string;
};

export type CollectionWithProfiles = Collection & {
  payer: Profile;
  receiver: Profile;
};

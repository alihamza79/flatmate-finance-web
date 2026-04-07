export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Groceries',
  'Utilities',
  'Entertainment',
  'Health',
  'Shopping',
  'Other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const QUERY_KEYS = {
  profiles: ['profiles'] as const,
  groupExpenses: ['group-expenses'] as const,
  personalExpenses: ['personal-expenses'] as const,
  collections: ['collections'] as const,
  balances: ['balances'] as const,
} as const;

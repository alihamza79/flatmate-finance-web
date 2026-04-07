import type { GroupExpenseWithDetails, BalanceEntry, Profile, Collection } from '@/types';

export function calculateBalances(
  expenses: GroupExpenseWithDetails[],
  collections: Collection[],
  profiles: Profile[],
): BalanceEntry[] {
  const profileMap = new Map(profiles.map((p) => [p.id, p.full_name]));

  const ledger = new Map<string, Map<string, { amount: number; expenseIds: string[] }>>();

  const ensureLedgerEntry = (from: string, to: string): { amount: number; expenseIds: string[] } => {
    if (!ledger.has(from)) ledger.set(from, new Map());
    const inner = ledger.get(from) as Map<string, { amount: number; expenseIds: string[] }>;
    if (!inner.has(to)) inner.set(to, { amount: 0, expenseIds: [] });
    return inner.get(to) as { amount: number; expenseIds: string[] };
  };

  for (const expense of expenses) {
    const payerId = expense.created_by;

    for (const participant of expense.participants) {
      if (participant.user_id === payerId) continue;

      const entry = ensureLedgerEntry(participant.user_id, payerId);
      entry.amount += participant.share_amount;
      entry.expenseIds.push(expense.id);
    }
  }

  for (const col of collections) {
    if (col.paid_by === col.paid_to) continue;
    const entry = ensureLedgerEntry(col.paid_by, col.paid_to);
    entry.amount -= col.amount;
  }

  const seen = new Set<string>();
  const result: BalanceEntry[] = [];

  for (const [debtorId, creditors] of ledger) {
    for (const [creditorId, { amount, expenseIds }] of creditors) {
      const pairKey = [debtorId, creditorId].sort().join(':');
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);

      const reverseEntry = ledger.get(creditorId)?.get(debtorId);
      const reverseAmount = reverseEntry?.amount ?? 0;
      const reverseExpenseIds = reverseEntry?.expenseIds ?? [];

      const netAmount = amount - reverseAmount;
      const allExpenseIds = [...new Set([...expenseIds, ...reverseExpenseIds])];

      if (Math.abs(netAmount) < 0.01) continue;

      const from = netAmount > 0 ? debtorId : creditorId;
      const to = netAmount > 0 ? creditorId : debtorId;
      const absAmount = Math.round(Math.abs(netAmount) * 100) / 100;

      result.push({
        from,
        fromName: profileMap.get(from) ?? 'Unknown',
        to,
        toName: profileMap.get(to) ?? 'Unknown',
        amount: absAmount,
        expenseIds: allExpenseIds,
      });
    }
  }

  return result.sort((a, b) => b.amount - a.amount);
}

export function getNetBalance(
  userId: string,
  balances: BalanceEntry[],
): number {
  let net = 0;
  for (const entry of balances) {
    if (entry.from === userId) net -= entry.amount;
    if (entry.to === userId) net += entry.amount;
  }
  return net;
}

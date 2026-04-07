export function formatCurrency(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const formatted = rounded.toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `PKR ${formatted}`;
}

export function formatCompact(amount: number): string {
  if (amount >= 100000) {
    return `PKR ${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `PKR ${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
}

export function formatCompactAmount(amount: number): string {
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return String(Math.round(amount));
}

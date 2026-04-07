import React from 'react';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, { container: string; text: string }> = {
  success: { container: 'bg-emerald-900/40', text: 'text-emerald-300' },
  danger: { container: 'bg-red-900/40', text: 'text-red-300' },
  warning: { container: 'bg-amber-900/40', text: 'text-amber-300' },
  info: { container: 'bg-indigo-900/40', text: 'text-indigo-300' },
  neutral: { container: 'bg-slate-700', text: 'text-slate-300' },
};

export function Badge({ label, variant = 'neutral' }: BadgeProps): React.JSX.Element {
  const { container, text } = variantClasses[variant];
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full ${container}`}>
      <span className={`text-xs font-semibold ${text}`}>{label}</span>
    </span>
  );
}

import React from 'react';

type EmptyStateProps = {
  icon: string;
  title: string;
  subtitle?: string;
};

export function EmptyState({ icon, title, subtitle }: EmptyStateProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <span className="text-5xl mb-4">{icon}</span>
      <p className="text-lg font-semibold text-slate-200 text-center mb-2">
        {title}
      </p>
      {subtitle ? (
        <p className="text-sm text-slate-500 text-center">{subtitle}</p>
      ) : null}
    </div>
  );
}

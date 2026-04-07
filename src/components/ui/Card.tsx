import React from 'react';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'flat';
};

export function Card({ children, className, variant = 'default' }: CardProps): React.JSX.Element {
  return (
    <div
      className={`
        bg-bg-card rounded-2xl
        ${variant === 'default' ? 'border border-slate-700/50' : ''}
        ${className ?? ''}
      `}
    >
      {children}
    </div>
  );
}

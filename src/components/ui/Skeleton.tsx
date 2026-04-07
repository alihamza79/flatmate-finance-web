import React from 'react';

type SkeletonProps = {
  width?: string;
  height?: number;
  className?: string;
  rounded?: boolean;
};

export function Skeleton({ height = 20, className, rounded = false }: SkeletonProps): React.JSX.Element {
  return (
    <div
      style={{ height }}
      className={`bg-slate-700 animate-pulse ${rounded ? 'rounded-full' : 'rounded-lg'} ${className ?? ''}`}
    />
  );
}

export function ExpenseCardSkeleton(): React.JSX.Element {
  return (
    <div className="bg-bg-card rounded-2xl p-4 mb-3 border border-slate-700/50">
      <div className="flex justify-between mb-3">
        <Skeleton height={16} className="w-1/3" />
        <Skeleton height={16} className="w-1/4" />
      </div>
      <Skeleton height={12} className="w-1/2 mb-2" />
      <Skeleton height={12} className="w-2/3" />
    </div>
  );
}

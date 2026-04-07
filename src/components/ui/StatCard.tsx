import React from 'react';
import { Card } from './Card';

type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  trend?: { value: string; isPositive: boolean } | null;
  accent?: string;
};

export function StatCard({ title, value, subtitle, trend, accent = 'bg-primary-500' }: StatCardProps): React.JSX.Element {
  return (
    <Card className="p-4 flex-1">
      <div className={`w-2 h-2 rounded-full ${accent} mb-3`} />
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">
        {title}
      </p>
      <p className="text-xl font-bold text-white truncate">
        {value}
      </p>
      {subtitle ? (
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      ) : null}
      {trend ? (
        <div className="flex items-center mt-2">
          <span className={trend.isPositive ? 'text-danger text-xs font-semibold' : 'text-success text-xs font-semibold'}>
            {trend.isPositive ? '▲' : '▼'} {trend.value}
          </span>
          <span className="text-slate-500 text-xs ml-1">vs last month</span>
        </div>
      ) : null}
    </Card>
  );
}

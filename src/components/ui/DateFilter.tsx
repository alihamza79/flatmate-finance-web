'use client';
import React, { useState, useCallback } from 'react';
import {
  startOfDay, endOfDay, startOfMonth, endOfMonth,
  isWithinInterval, subDays,
} from 'date-fns';

export type DateFilterRange = 'today' | '7d' | 'month' | 'all' | 'custom';

function parseDateSafe(dateStr: string): Date {
  if (dateStr.includes('T') || dateStr.includes('Z')) return new Date(dateStr);
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function useDateFilter(initialRange: DateFilterRange = 'month') {
  const [range, setRange] = useState<DateFilterRange>(initialRange);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const filterFn = useCallback(
    (dateStr: string): boolean => {
      if (range === 'all') return true;

      const date = parseDateSafe(dateStr);
      const now = new Date();

      if (range === 'today') {
        return isWithinInterval(date, { start: startOfDay(now), end: endOfDay(now) });
      }
      if (range === '7d') {
        return isWithinInterval(date, { start: startOfDay(subDays(now, 6)), end: endOfDay(now) });
      }
      if (range === 'month') {
        return isWithinInterval(date, { start: startOfMonth(now), end: endOfMonth(now) });
      }
      if (range === 'custom') {
        const from = customFrom ? parseDateSafe(customFrom) : null;
        const to = customTo ? parseDateSafe(customTo) : null;
        if (from && date < startOfDay(from)) return false;
        if (to && date > endOfDay(to)) return false;
        return true;
      }
      return true;
    },
    [range, customFrom, customTo],
  );

  return { range, setRange, customFrom, setCustomFrom, customTo, setCustomTo, filterFn };
}

type DateFilterBarProps = {
  range: DateFilterRange;
  setRange: (r: DateFilterRange) => void;
  customFrom: string;
  setCustomFrom: (s: string) => void;
  customTo: string;
  setCustomTo: (s: string) => void;
};

const FILTERS: { key: DateFilterRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 Days' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All' },
  { key: 'custom', label: 'Custom' },
];

export function DateFilterBar({
  range,
  setRange,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
}: DateFilterBarProps): React.JSX.Element {
  return (
    <div className="mb-3">
      <div className="flex gap-2 mb-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setRange(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              range === f.key
                ? 'bg-primary-600 text-white'
                : 'bg-bg-card border border-slate-700 text-slate-400 hover:text-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {range === 'custom' ? (
        <div className="flex gap-2">
          <div className="flex-1 bg-bg-input border border-slate-600 rounded-lg px-3 py-2 flex items-center">
            <span className="text-slate-500 text-xs mr-2">From</span>
            <input
              type="date"
              className="flex-1 text-sm text-slate-100 bg-transparent outline-none"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
          </div>
          <div className="flex-1 bg-bg-input border border-slate-600 rounded-lg px-3 py-2 flex items-center">
            <span className="text-slate-500 text-xs mr-2">To</span>
            <input
              type="date"
              className="flex-1 text-sm text-slate-100 bg-transparent outline-none"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

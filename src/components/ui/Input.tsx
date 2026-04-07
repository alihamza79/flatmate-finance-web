'use client';
import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: string;
};

export function Input({ label, error, hint, prefix, className, ...rest }: InputProps): React.JSX.Element {
  return (
    <div className="mb-4">
      {label ? (
        <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      ) : null}
      <div
        className={`
          flex items-center
          bg-bg-input
          border rounded-xl px-4 py-3
          ${error ? 'border-red-400' : 'border-slate-600'}
        `}
      >
        {prefix ? (
          <span className="text-slate-400 mr-2 text-base">{prefix}</span>
        ) : null}
        <input
          className={`flex-1 bg-transparent text-base text-slate-100 outline-none ${className ?? ''}`}
          {...rest}
        />
      </div>
      {error ? (
        <p className="text-danger text-xs mt-1">{error}</p>
      ) : hint ? (
        <p className="text-slate-500 text-xs mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

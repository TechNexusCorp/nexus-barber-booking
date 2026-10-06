import React, { forwardRef } from 'react';

export const Input = forwardRef(({ label, id, error, className = '', ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-surface-200">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`w-full bg-surface-950 border border-surface-800 rounded-md px-3 py-2 text-surface-100 placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-colors ${
          error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

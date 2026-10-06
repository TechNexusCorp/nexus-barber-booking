import React from 'react';

export const Badge = ({ children, variant = 'default', className = '', ...props }) => {
  const variants = {
    default: "bg-surface-800 text-surface-200 border border-surface-700",
    primary: "bg-primary-900/40 text-primary-400 border border-primary-700/50",
    success: "bg-emerald-900/40 text-emerald-400 border border-emerald-700/50",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};

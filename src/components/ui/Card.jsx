import React from 'react';

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-dark-card border border-dark-border rounded-lg shadow-subtle p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

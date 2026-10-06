import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "inline-flex items-center justify-center rounded-md font-semibold transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary-500 text-surface-950 hover:bg-primary-400 hover:shadow-gold px-4 py-2",
    secondary: "bg-surface-800 text-primary-500 hover:bg-surface-700 px-4 py-2",
    outline: "border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-surface-950 px-4 py-2",
    ghost: "text-surface-300 hover:text-primary-500 hover:bg-surface-800 px-3 py-2"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

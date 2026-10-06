import React from 'react';

export const Section = ({ title, subtitle, children, className = '', ...props }) => {
  return (
    <section className={`py-12 md:py-16 ${className}`} {...props}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {(title || subtitle) && (
          <div className="mb-10 text-center md:text-left">
            {subtitle && <p className="text-primary-500 font-semibold tracking-wider uppercase text-sm mb-2">{subtitle}</p>}
            {title && <h2 className="text-3xl md:text-4xl text-surface-50">{title}</h2>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
};

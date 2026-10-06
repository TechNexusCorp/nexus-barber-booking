import React, { useState } from 'react';
import { Menu, X, Scissors } from 'lucide-react';
import { Button } from '../ui/Button';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navLinks = [
    { name: 'Início', href: '#' },
    { name: 'Serviços', href: '#' },
    { name: 'Barbeiros', href: '#' },
    { name: 'Contato', href: '#' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-dark-border bg-dark-bg/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 text-primary-500">
          <Scissors className="h-8 w-8" />
          <span className="text-xl font-bold tracking-tight text-surface-50 font-display">FIO A FIO</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} className="text-sm font-medium text-surface-300 hover:text-primary-500 transition-colors">
              {link.name}
            </a>
          ))}
          <Button variant="primary">Agendar Horário</Button>
        </nav>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-surface-100 hover:text-primary-500 transition-colors" onClick={toggleMenu}>
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-dark-border bg-dark-card p-4 absolute w-full flex flex-col gap-4 shadow-xl">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} className="text-base font-medium text-surface-200 hover:text-primary-500 p-2 rounded-md hover:bg-surface-800 transition-colors" onClick={() => setIsMenuOpen(false)}>
              {link.name}
            </a>
          ))}
          <Button variant="primary" className="w-full mt-2">Agendar Horário</Button>
        </div>
      )}
    </header>
  );
};

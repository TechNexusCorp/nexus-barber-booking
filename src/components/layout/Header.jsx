import React, { useState } from 'react';
import { Menu, X, Scissors, User, LogOut, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';

export const Header = ({ onNavigate, user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onNavigate('login');
  };

  const navLinks = [
    { name: 'Início', target: 'home' },
    { name: 'Serviços', target: 'home' },
    { name: 'Barbeiros', target: 'home' },
    { name: 'Contato', target: 'home' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-dark-border bg-dark-bg/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-20 flex items-center justify-between">
        {/* Logo */}
        <div 
          className="flex items-center gap-2 text-primary-500 cursor-pointer"
          onClick={() => onNavigate('home')}
        >
          <Scissors className="h-8 w-8" />
          <span className="text-xl font-bold tracking-tight text-surface-50 font-display">FIO A FIO</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button 
              key={link.name} 
              onClick={() => onNavigate(link.target)} 
              className="text-sm font-medium text-surface-300 hover:text-primary-500 transition-colors"
            >
              {link.name}
            </button>
          ))}
          {user ? (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => onNavigate('appointments')} 
                className="flex items-center gap-2 text-sm font-medium text-surface-300 hover:text-primary-500 transition-colors"
              >
                <Calendar size={18} />
                <span>Meus Agendamentos</span>
              </button>
              <span className="text-sm font-medium text-surface-50 flex items-center gap-2 border-l border-surface-800 pl-4">
                <User size={18} className="text-primary-500" />
                {user.user_metadata?.full_name?.split(' ')[0] || user.email}
              </span>
              <button 
                onClick={handleSignOut} 
                className="flex items-center gap-1 text-sm font-medium text-surface-400 hover:text-red-400 transition-colors"
              >
                <LogOut size={16} />
                <span>Sair</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => onNavigate('login')} 
              className="flex items-center gap-2 text-sm font-medium text-surface-300 hover:text-primary-500 transition-colors"
            >
              <User size={18} />
              <span>Entrar</span>
            </button>
          )}
          <Button variant="primary" onClick={() => onNavigate('booking')}>Agendar Horário</Button>
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
            <button 
              key={link.name} 
              onClick={() => { onNavigate(link.target); setIsMenuOpen(false); }}
              className="text-base font-medium text-surface-200 hover:text-primary-500 p-2 rounded-md hover:bg-surface-800 transition-colors text-left"
            >
              {link.name}
            </button>
          ))}
          {user ? (
            <>
              <div className="flex flex-col gap-2 p-2 border-t border-surface-800 mt-2">
                <div className="flex items-center gap-2 text-base font-medium text-surface-50">
                  <User size={20} className="text-primary-500" />
                  <span>Olá, {user.user_metadata?.full_name?.split(' ')[0] || user.email}</span>
                </div>
                <button 
                  onClick={() => { onNavigate('appointments'); setIsMenuOpen(false); }}
                  className="flex items-center gap-2 text-base font-medium text-surface-300 hover:text-primary-500 transition-colors text-left py-2"
                >
                  <Calendar size={20} />
                  <span>Meus Agendamentos</span>
                </button>
              </div>
              <button 
                onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                className="flex items-center gap-2 text-base font-medium text-surface-400 hover:text-red-400 p-2 rounded-md transition-colors text-left"
              >
                <LogOut size={20} />
                <span>Sair</span>
              </button>
            </>
          ) : (
            <button 
              onClick={() => { onNavigate('login'); setIsMenuOpen(false); }}
              className="flex items-center gap-2 text-base font-medium text-surface-200 hover:text-primary-500 p-2 rounded-md hover:bg-surface-800 transition-colors text-left"
            >
              <User size={20} />
              <span>Entrar / Cadastrar</span>
            </button>
          )}
          <Button variant="primary" className="w-full mt-2" onClick={() => onNavigate('booking')}>Agendar Horário</Button>
        </div>
      )}
    </header>
  );
};

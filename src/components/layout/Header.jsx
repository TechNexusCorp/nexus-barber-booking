import React, { useState } from 'react';
import { Menu, X, Scissors, User, LogOut, Calendar, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';

export const Header = ({ onNavigate, user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [newName, setNewName] = useState(user?.user_metadata?.full_name || '');
  const [newPhone, setNewPhone] = useState(user?.user_metadata?.phone || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const isAdmin = user?.user_metadata?.is_admin === true;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onNavigate('login');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileMessage('');
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: newName,
          phone: newPhone
        }
      });
      if (error) throw error;
      setProfileMessage('Perfil atualizado com sucesso!');
      setTimeout(() => {
        setIsProfileOpen(false);
        setProfileMessage('');
      }, 2000);
    } catch (error) {
      setProfileMessage('Erro ao atualizar: ' + error.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    // Mask: (XX) XXXXX-XXXX
    if (value.length > 2) {
      value = `(${value.slice(0,2)}) ${value.slice(2)}`;
    }
    if (value.length > 10) {
      value = `${value.slice(0,10)}-${value.slice(10)}`;
    }
    setNewPhone(value);
  };

  const openProfileModal = () => {
    setNewName(user?.user_metadata?.full_name || '');
    let p = user?.user_metadata?.phone || '';
    p = p.replace(/\D/g, '');
    if (p.length > 2) p = `(${p.slice(0,2)}) ${p.slice(2)}`;
    if (p.length > 10) p = `${p.slice(0,10)}-${p.slice(10)}`;
    setNewPhone(p);
    setIsProfileOpen(true);
  };

  const navLinks = [
    { name: 'Início', target: 'home' },
    { name: 'Serviços', target: 'home', id: 'servicos' },
    { name: 'Barbeiros', target: 'home', id: 'barbeiros' },
    { name: 'Contato', target: 'home', id: 'contato' },
  ];

  const handleNavClick = (link) => {
    onNavigate(link.target);
    setTimeout(() => {
      if (link.id) {
        const element = document.getElementById(link.id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (link.name === 'Início') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-dark-border bg-dark-bg/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-20 flex items-center justify-between">
        {/* Logo */}
        <div 
          className="flex items-center gap-2 text-primary-500 cursor-pointer"
          onClick={() => { onNavigate('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        >
          <Scissors className="h-8 w-8" />
          <span className="text-xl font-bold tracking-tight text-surface-50 font-display">FIO A FIO</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button 
              key={link.name} 
              onClick={() => handleNavClick(link)} 
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
              {isAdmin && (
                <button 
                  id="nav-admin-settings"
                  onClick={() => onNavigate('settings')} 
                  className="flex items-center gap-2 text-sm font-medium text-surface-300 hover:text-primary-500 transition-colors"
                >
                  <Settings size={18} />
                  <span>Configurações</span>
                </button>
              )}
              <button 
                onClick={openProfileModal}
                className="text-sm font-medium text-surface-50 flex items-center gap-2 border-l border-surface-800 pl-4 hover:text-primary-500 transition-colors cursor-pointer"
              >
                <User size={18} className="text-primary-500" />
                {user.user_metadata?.full_name?.split(' ')[0] || user.email}
              </button>
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
              onClick={() => { handleNavClick(link); setIsMenuOpen(false); }}
              className="text-base font-medium text-surface-200 hover:text-primary-500 p-2 rounded-md hover:bg-surface-800 transition-colors text-left"
            >
              {link.name}
            </button>
          ))}
          {user ? (
            <>
              <div className="flex flex-col gap-2 p-2 border-t border-surface-800 mt-2">
                <button 
                  onClick={() => {
                    openProfileModal();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-base font-medium text-surface-50 hover:text-primary-500 transition-colors cursor-pointer text-left py-2"
                >
                  <User size={20} className="text-primary-500" />
                  <span>Olá, {user.user_metadata?.full_name?.split(' ')[0] || user.email}</span>
                </button>
                <button 
                  onClick={() => { onNavigate('appointments'); setIsMenuOpen(false); }}
                  className="flex items-center gap-2 text-base font-medium text-surface-300 hover:text-primary-500 transition-colors text-left py-2"
                >
                  <Calendar size={20} />
                  <span>Meus Agendamentos</span>
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => { onNavigate('settings'); setIsMenuOpen(false); }}
                    className="flex items-center gap-2 text-base font-medium text-surface-300 hover:text-primary-500 transition-colors text-left py-2"
                  >
                    <Settings size={20} />
                    <span>Configurações</span>
                  </button>
                )}
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

      {/* Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-dark-card border border-surface-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-surface-50">Editar Perfil</h3>
              <button onClick={() => setIsProfileOpen(false)} className="text-surface-400 hover:text-surface-100">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">Nome</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2.5 text-surface-50 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">Telefone</label>
                <input 
                  type="text" 
                  value={newPhone} 
                  onChange={handlePhoneChange}
                  className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2.5 text-surface-50 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                  required
                />
              </div>

              {profileMessage && (
                <div className={`p-3 rounded-lg text-sm text-center ${profileMessage.includes('Erro') ? 'bg-red-950/50 text-red-400 border border-red-900' : 'bg-emerald-950/50 text-emerald-400 border border-emerald-900'}`}>
                  {profileMessage}
                </div>
              )}

              <Button type="submit" variant="primary" className="w-full" disabled={updatingProfile}>
                {updatingProfile ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

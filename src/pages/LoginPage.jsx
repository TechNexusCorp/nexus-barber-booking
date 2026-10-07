import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Scissors, ArrowLeft, Mail, Lock, User, Phone } from 'lucide-react';

export default function LoginPage({ onNavigate }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onNavigate('home');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              phone: phone,
            },
          },
        });
        if (error) throw error;
        setIsLogin(true);
        setMessage('Cadastro realizado! Verifique seu email para confirmar. Procure por um email de "Supabase Auth" (verifique também o spam).');
      }
    } catch (err) {
      setError(err.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col font-sans text-surface-100 relative overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-primary-900/10 rounded-full blur-[100px] pointer-events-none" />

      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-md bg-dark-card border border-surface-800 rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-surface-900 rounded-full flex items-center justify-center text-primary-500 border border-surface-800 mb-4 shadow-gold">
              <Scissors className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-display font-bold text-surface-50">FIO A FIO</h1>
            <p className="text-surface-400 mt-2 text-center">
              {isLogin ? 'Bem-vindo de volta, mestre.' : 'Junte-se à nossa irmandade.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-500">
                  <User size={18} />
                </div>
                <Input 
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-surface-900 border-surface-700"
                  required
                />
              </div>
            )}
            {!isLogin && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-500">
                  <Phone size={18} />
                </div>
                <Input 
                  placeholder="Seu telefone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 bg-surface-900 border-surface-700"
                  required
                />
              </div>
            )}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-500">
                <Mail size={18} />
              </div>
              <Input 
                type="email"
                placeholder="Seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-surface-900 border-surface-700"
                required
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-500">
                <Lock size={18} />
              </div>
              <Input 
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-surface-900 border-surface-700"
                required
              />
            </div>

            {error && <div className="p-3 bg-red-950/50 border border-red-900 text-red-400 text-sm rounded-lg text-center">{error}</div>}
            {message && <div className="p-3 bg-emerald-950/50 border border-emerald-900 text-emerald-400 text-sm rounded-lg text-center">{message}</div>}

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full py-3 mt-4 font-bold text-lg"
              disabled={loading}
            >
              {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
            </Button>
          </form>

          <div className="mt-8 text-center border-t border-surface-800 pt-6">
            <p className="text-surface-400 text-sm">
              {isLogin ? "Ainda não tem uma conta?" : "Já possui uma conta?"}
              <button 
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }}
                className="ml-2 text-primary-500 hover:text-primary-400 font-semibold transition-colors"
              >
                {isLogin ? "Criar agora" : "Fazer login"}
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

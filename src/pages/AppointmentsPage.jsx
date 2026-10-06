import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Calendar, Clock, Scissors, MapPin, CheckCircle, Clock3, User as UserIcon, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { services, barbers } from '../data/mockData';

export default function AppointmentsPage({ onNavigate, user }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Verifica se é admin pelo metadata
  const isAdmin = user?.user_metadata?.is_admin === true;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchAppointments = async () => {
      setLoading(true);
      try {
        let query = supabase.from('appointments').select('*');
        
        if (isAdmin) {
          // Admin vê todos os agendamentos futuros (ou de hoje) ordenados
          const today = new Date().toISOString().split('T')[0];
          query = query.gte('date', today).order('date', { ascending: true }).order('time', { ascending: true });
        } else {
          // Usuário comum vê só os seus
          query = query.order('date', { ascending: false }).order('time', { ascending: false });
        }

        const { data, error } = await query;
        if (error) throw error;
        setAppointments(data || []);
      } catch (err) {
        console.error('Erro ao buscar agendamentos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user, isAdmin]);

  const upcoming = appointments.filter(a => a.status === 'upcoming');
  const past = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled');

  const getServiceNames = (ids) => {
    return ids.map(id => services.find(s => s.id === id)?.name || id).join(', ');
  };

  const getBarberName = (id) => {
    if (id === 'any') return 'Sem preferência';
    return barbers.find(b => b.id === id)?.name || id;
  };

  const AppointmentCard = ({ appointment }) => {
    const isUpcoming = appointment.status === 'upcoming';
    
    return (
      <Card className="relative overflow-hidden group hover:border-surface-600 transition-colors">
        <div className={`absolute top-0 left-0 w-1 h-full ${isUpcoming ? 'bg-primary-500' : 'bg-surface-600'}`} />
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-surface-50">{getServiceNames(appointment.service_ids)}</h3>
            <p className="text-sm text-surface-400 flex items-center gap-2 mt-1">
              <Scissors size={14} /> com {getBarberName(appointment.barber_id)}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${isUpcoming ? 'bg-primary-900/20 text-primary-500 border border-primary-500/20' : 'bg-surface-800 text-surface-400 border border-surface-700'}`}>
            {isUpcoming ? <Clock3 size={12} /> : <CheckCircle size={12} />}
            {appointment.status === 'cancelled' ? 'Cancelado' : isUpcoming ? 'Próximo' : 'Concluído'}
          </div>
        </div>

        {isAdmin && (
          <div className="mt-4 mb-4 p-3 bg-surface-900 rounded-lg border border-surface-800">
            <p className="text-sm font-semibold text-surface-50 flex items-center gap-2 mb-1">
              <UserIcon size={14} className="text-primary-500"/> {appointment.customer_name}
            </p>
            <p className="text-sm text-surface-400 flex items-center gap-2">
              <Phone size={14} /> {appointment.customer_phone}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-4 border-t border-surface-800 pt-4">
          <div className="flex items-center gap-2 text-surface-200">
            <Calendar size={16} className="text-primary-500" />
            <span className="text-sm">{appointment.date.split('-').reverse().join('/')}</span>
          </div>
          <div className="flex items-center gap-2 text-surface-200">
            <Clock size={16} className="text-primary-500" />
            <span className="text-sm">{appointment.time}</span>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-dark-bg text-surface-100">
      <Header onNavigate={onNavigate} user={user} />
      
      <main className="flex-1 container mx-auto px-4 max-w-4xl py-12">
        <h1 className="text-3xl font-display font-bold text-surface-50 mb-2">
          {isAdmin ? 'Painel Administrativo' : 'Meus Agendamentos'}
        </h1>
        <p className="text-surface-400 mb-10">
          {isAdmin ? 'Visão geral de todos os agendamentos da barbearia.' : 'Acompanhe seus horários marcados e histórico na barbearia.'}
        </p>

        {loading ? (
          <p className="text-surface-400 text-center py-12">Carregando...</p>
        ) : (
          <>
            <section className="mb-12">
              <h2 className="text-xl font-display text-surface-50 mb-6 flex items-center gap-2">
                <Clock3 className="text-primary-500" /> {isAdmin ? 'Próximos Horários (Todos)' : 'Próximos Horários'}
              </h2>
              {upcoming.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcoming.map(app => <AppointmentCard key={app.id} appointment={app} />)}
                </div>
              ) : (
                <div className="bg-surface-900 border border-surface-800 rounded-lg p-8 text-center">
                  <p className="text-surface-400 mb-4">Nenhum agendamento futuro encontrado.</p>
                  {!isAdmin && (
                    <button 
                      onClick={() => onNavigate('booking')}
                      className="text-primary-500 hover:text-primary-400 font-semibold transition-colors"
                    >
                      Agendar um horário
                    </button>
                  )}
                </div>
              )}
            </section>

            {!isAdmin && (
              <section>
                <h2 className="text-xl font-display text-surface-50 mb-6 flex items-center gap-2">
                  <CheckCircle className="text-surface-400" /> Histórico
                </h2>
                {past.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {past.map(app => <AppointmentCard key={app.id} appointment={app} />)}
                  </div>
                ) : (
                  <p className="text-surface-400">Nenhum histórico encontrado.</p>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

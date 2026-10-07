import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronDown, Check, Calendar as CalendarIcon, Clock, Scissors, User, MapPin, Sun, Sunset } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { barbers, contactInfo } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { useServices, formatPrice, formatDuration } from '../hooks/useServices';
import { SHIFTS, generateShiftSlots, isBarberFree, findFreeBarber, addMinutes } from '../lib/schedule';

const STEPS = [
  { id: 1, title: 'Serviço' },
  { id: 2, title: 'Profissional' },
  { id: 3, title: 'Data e Hora' },
  { id: 4, title: 'Seus Dados' },
  { id: 5, title: 'Confirmação' },
];


export default function BookingPage({ onNavigate, user }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [booking, setBooking] = useState({
    serviceIds: [],
    barberId: null, // 'any' for no preference
    date: '',
    time: '',
    customer: { 
      name: user?.user_metadata?.full_name || '', 
      phone: user?.user_metadata?.phone || '', 
      notes: '' 
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [busySlots, setBusySlots] = useState([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);
  const [openShift, setOpenShift] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const { services } = useServices();

  useEffect(() => {
    if (currentStep === 3 && booking.date && booking.barberId) {
      const fetchBusySlots = async () => {
        setIsLoadingTimes(true);
        try {
          // RPC segura: devolve só barbeiro/início/duração de TODOS os agendamentos do dia
          const { data, error } = await supabase.rpc('get_busy_slots', { p_date: booking.date });
          if (error) throw error;
          setBusySlots(data || []);
        } catch (error) {
          console.error("Erro ao buscar horários ocupados:", error);
          setBusySlots([]);
        } finally {
          setIsLoadingTimes(false);
        }
      };

      fetchBusySlots();
    }
  }, [currentStep, booking.date, booking.barberId, reloadKey]);

  useEffect(() => {
    if (user?.user_metadata) {
      setBooking(prev => ({
        ...prev,
        customer: {
          ...prev.customer,
          name: prev.customer.name || user.user_metadata.full_name || '',
          phone: prev.customer.phone || user.user_metadata.phone || '',
        }
      }));
    }
  }, [user]);

  const handleNext = () => {
    // Validation
    if (currentStep === 1 && booking.serviceIds.length === 0) {
      alert("Selecione pelo menos um serviço.");
      return;
    }
    if (currentStep === 2 && !booking.barberId) {
      alert("Selecione um profissional.");
      return;
    }
    if (currentStep === 3 && (!booking.date || !booking.time)) {
      alert("Selecione uma data e horário.");
      return;
    }
    if (currentStep === 4) {
      const newErrors = {};
      if (!booking.customer.name.trim()) newErrors.name = "Nome é obrigatório";
      if (booking.customer.phone.length < 14) newErrors.phone = "Telefone inválido";
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

    if (currentStep === 5) {
      if (!user) {
        alert("Você precisa estar logado para agendar um horário.");
        onNavigate('login');
        return;
      }
      
      // "Sem preferência": atribui automaticamente um barbeiro livre no intervalo inteiro
      let assignedBarberId = booking.barberId;
      if (assignedBarberId === 'any') {
        const freeBarber = findFreeBarber(barbers, booking.time, totalDuration, busySlots);
        if (!freeBarber) {
          alert("Esse horário acabou de ser ocupado. Por favor, escolha outro.");
          setBooking(prev => ({ ...prev, time: '' }));
          setReloadKey(k => k + 1);
          setCurrentStep(3);
          return;
        }
        assignedBarberId = freeBarber.id;
      }

      setIsLoading(true);
      const insertAppointment = async () => {
        try {
          const { error } = await supabase.from('appointments').insert([
            {
              user_id: user.id,
              customer_name: booking.customer.name,
              customer_phone: booking.customer.phone,
              barber_id: assignedBarberId,
              service_ids: booking.serviceIds,
              date: booking.date,
              time: booking.time,
              status: 'upcoming',
              total_price: totalPrice,
              duration_minutes: totalDuration,
              notes: booking.customer.notes || null,
            }
          ]);
          
          if (error) {
            // 23505 = unique violation | 23P01 = exclusion violation (horário sobreposto)
            if (error.code === '23505' || error.code === '23P01') {
              alert("Oops! Alguém foi mais rápido e reservou esse horário. Por favor, escolha outro.");
              setBooking(prev => ({ ...prev, time: '' }));
              setReloadKey(k => k + 1);
              setCurrentStep(3); // volta para a escolha de horário
              return;
            }
            throw error;
          }
          
          if (booking.barberId === 'any') {
            setBooking(prev => ({ ...prev, assignedBarberId }));
          }
          setCurrentStep(6);
        } catch (error) {
          console.error("Erro ao salvar agendamento:", error);
          alert("Ocorreu um erro ao salvar seu agendamento. Tente novamente.");
        } finally {
          setIsLoading(false);
        }
      };

      insertAppointment();
      return;
    }

    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep === 1) {
      onNavigate('home');
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  const toggleService = (id) => {
    setBooking(prev => {
      const isSelected = prev.serviceIds.includes(id);
      let next;

      if (isSelected) {
        next = prev.serviceIds.filter(sId => sId !== id);
      } else {
        const clicked = services.find(s => s.id === id);
        const parts = clicked?.combo_of || [];
        next = prev.serviceIds.filter(sId => {
          // Marcou um combo -> desmarca os avulsos que ele já inclui
          if (parts.includes(sId)) return false;
          // Marcou um avulso -> desmarca combos que já incluem ele
          const other = services.find(s => s.id === sId);
          if (other?.combo_of?.includes(id)) return false;
          return true;
        });
        next.push(id);

        // Marcou todos os avulsos de um combo -> troca automaticamente pelo combo (preço com desconto)
        services.forEach(combo => {
          if (combo.combo_of?.length && combo.combo_of.every(p => next.includes(p))) {
            next = [...next.filter(p => !combo.combo_of.includes(p)), combo.id];
          }
        });
      }

      // Duração mudou -> o horário escolhido pode não caber mais
      return { ...prev, serviceIds: next, time: '' };
    });
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
    
    setBooking(prev => ({ ...prev, customer: { ...prev.customer, phone: value } }));
    if (errors.phone) setErrors(prev => ({ ...prev, phone: null }));
  };

  const selectedServicesList = services.filter(s => booking.serviceIds.includes(s.id));
  const totalPrice = selectedServicesList.reduce((acc, curr) => acc + curr.price, 0);
  const totalDuration = selectedServicesList.reduce((acc, curr) => acc + curr.duration_minutes, 0);

  // Horários por turno: um horário está livre se o intervalo inteiro [início, início + duração) não sobrepõe nada
  const shiftSlots = useMemo(() => SHIFTS.map(shift => {
    const slots = generateShiftSlots(shift, totalDuration || 5).map(time => {
      const free = booking.barberId === 'any'
        ? !!findFreeBarber(barbers, time, totalDuration, busySlots)
        : isBarberFree(booking.barberId, time, totalDuration, busySlots);
      return { time, free };
    });
    return { shift, slots, freeCount: slots.filter(s => s.free).length };
  }), [totalDuration, booking.barberId, busySlots]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-display text-surface-50 mb-6">Escolha o Serviço</h2>
            {services.map(service => {
              const isSelected = booking.serviceIds.includes(service.id);
              return (
                <Card 
                  key={service.id} 
                  className={`cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg ${isSelected ? 'border-primary-500 bg-primary-900/10' : 'hover:border-surface-600'}`}
                  onClick={() => toggleService(service.id)}
                  tabIndex={0}
                  onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleService(service.id); } }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-surface-50">{service.name}</h3>
                      <p className="text-sm text-surface-400 mt-1">{service.description}</p>
                      <span className="inline-flex items-center gap-1 mt-2 text-xs text-surface-400 bg-surface-900 px-2 py-0.5 rounded-md border border-surface-800">
                        <Clock size={12} /> {formatDuration(service.duration_minutes)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0 pl-3">
                      <span className="font-bold text-primary-500 whitespace-nowrap">{formatPrice(service.price)}</span>
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${isSelected ? 'bg-primary-500 border-primary-500 text-surface-950' : 'border-surface-600 text-transparent'}`}>
                        <Check size={14} />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-display text-surface-50 mb-6">Escolha o Profissional</h2>
            
            <Card 
              className={`cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg ${booking.barberId === 'any' ? 'border-primary-500 bg-primary-900/10' : 'hover:border-surface-600'}`}
              onClick={() => setBooking(prev => ({ ...prev, barberId: 'any' }))}
              tabIndex={0}
              onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setBooking(prev => ({ ...prev, barberId: 'any' })); } }}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center text-surface-400">
                  <Scissors size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-surface-50">Sem preferência</h3>
                  <p className="text-sm text-surface-400">Qualquer profissional disponível</p>
                </div>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${booking.barberId === 'any' ? 'bg-primary-500 border-primary-500 text-surface-950' : 'border-surface-600 text-transparent'}`}>
                  <Check size={14} />
                </div>
              </div>
            </Card>

            {barbers.map(barber => {
              const isSelected = booking.barberId === barber.id;
              // Mock photo for demo if needed, but we have URLs
              return (
                <Card 
                  key={barber.id} 
                  className={`cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg ${isSelected ? 'border-primary-500 bg-primary-900/10' : 'hover:border-surface-600'}`}
                  onClick={() => setBooking(prev => ({ ...prev, barberId: barber.id }))}
                  tabIndex={0}
                  onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setBooking(prev => ({ ...prev, barberId: barber.id })); } }}
                >
                  <div className="flex items-center gap-4">
                    <img src={barber.photo || '/barber-1.jpg'} alt={barber.name} className="w-16 h-16 rounded-full object-cover" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-surface-50">{barber.name}</h3>
                      <p className="text-sm text-primary-500">{barber.specialty}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${isSelected ? 'bg-primary-500 border-primary-500 text-surface-950' : 'border-surface-600 text-transparent'}`}>
                      <Check size={14} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        );

      case 3:
        // Mocking next 7 days
        const dates = Array.from({length: 7}).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() + i + 1);
          return {
            full: d.toISOString().split('T')[0],
            day: d.getDate(),
            weekday: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
            disabled: d.getDay() === 0 || d.getDay() === 1 // Sun/Mon closed
          };
        });

        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-display text-surface-50 mb-6">Data e Hora</h2>
              <p className="text-sm text-surface-300 mb-4">Escolha a data:</p>
              <div className="grid grid-cols-7 gap-1.5 sm:gap-3 w-full">
                {dates.map(d => (
                  <button
                    key={d.full}
                    disabled={d.disabled}
                    onClick={() => { setBooking(prev => ({ ...prev, date: d.full, time: '' })); setOpenShift(null); }}
                    className={`w-full py-2 sm:py-4 rounded-lg flex flex-col items-center justify-center border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg ${
                      d.disabled 
                        ? 'opacity-30 cursor-not-allowed border-surface-800 bg-surface-900/50'
                        : booking.date === d.full 
                          ? 'border-primary-500 bg-primary-500 text-surface-950' 
                          : 'border-surface-700 bg-surface-900 hover:border-primary-500/50 text-surface-100'
                    }`}
                  >
                    <span className="text-[10px] sm:text-xs uppercase font-medium mb-0.5 sm:mb-1 truncate w-full text-center">{d.weekday}</span>
                    <span className="text-lg sm:text-2xl font-bold font-display leading-none">{d.day}</span>
                  </button>
                ))}
              </div>
            </div>

            {booking.date && (
              <div>
                <div className="flex items-center justify-between mb-4 gap-2">
                  <p className="text-sm text-surface-300">Horários disponíveis:</p>
                  <span className="text-xs text-surface-300 flex items-center gap-1 bg-surface-900 px-2 py-1 rounded-md border border-surface-800">
                    <Clock size={12} className="text-primary-500" /> Duração total: {formatDuration(totalDuration)}
                  </span>
                </div>
                {isLoadingTimes ? (
                  <div className="flex justify-center p-8">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shiftSlots.map(({ shift, slots, freeCount }) => {
                      const isOpen = openShift === shift.id;
                      const ShiftIcon = shift.id === 'morning' ? Sun : Sunset;
                      return (
                        <div
                          key={shift.id}
                          className={`rounded-xl border transition-all duration-300 ${isOpen ? 'border-primary-500/50 bg-primary-900/5 shadow-lg shadow-primary-500/5' : 'border-surface-800 bg-surface-900 hover:border-surface-600'}`}
                        >
                          <button
                            id={`shift-toggle-${shift.id}`}
                            type="button"
                            onClick={() => setOpenShift(isOpen ? null : shift.id)}
                            aria-expanded={isOpen}
                            className="w-full flex items-center justify-between p-4 text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-primary-500 text-surface-950' : 'bg-surface-800 text-primary-500'}`}>
                                <ShiftIcon size={18} />
                              </div>
                              <div>
                                <p className="font-semibold text-surface-50">{shift.label}</p>
                                <p className="text-xs text-surface-400">{shift.start} – {shift.end}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${freeCount > 0 ? 'bg-primary-900/20 text-primary-500 border border-primary-500/20' : 'bg-surface-800 text-surface-500 border border-surface-700'}`}>
                                {freeCount > 0 ? `${freeCount} livres` : 'Lotado'}
                              </span>
                              <ChevronDown size={18} className={`text-surface-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                            </div>
                          </button>

                          {isOpen && (
                            <div className="px-4 pb-4 grid grid-cols-4 sm:grid-cols-6 gap-2">
                              {slots.map(({ time, free }) => (
                                <button
                                  key={time}
                                  id={`slot-${time.replace(':', '')}`}
                                  disabled={!free}
                                  onClick={() => setBooking(prev => ({ ...prev, time }))}
                                  className={`py-2 rounded-md border text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                                    !free
                                      ? 'opacity-25 cursor-not-allowed border-surface-800 bg-surface-900/50 line-through'
                                      : booking.time === time
                                        ? 'border-primary-500 bg-primary-500 text-surface-950 scale-105 shadow-md shadow-primary-500/30'
                                        : 'border-surface-700 bg-surface-900 hover:border-primary-500/60 hover:-translate-y-0.5 text-surface-100'
                                  }`}
                                >
                                  {time}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {booking.time && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-primary-900/10 border border-primary-500/30 text-sm text-surface-100">
                        <Check size={16} className="text-primary-500" />
                        Seu horário: <span className="font-bold text-primary-500">{booking.time} → {addMinutes(booking.time, totalDuration)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-display text-surface-50 mb-6">Seus Dados</h2>
            <Input 
              label="Nome Completo" 
              placeholder="Digite seu nome" 
              value={booking.customer.name}
              onChange={e => {
                setBooking(prev => ({ ...prev, customer: { ...prev.customer, name: e.target.value } }));
                if (errors.name) setErrors(prev => ({ ...prev, name: null }));
              }}
              error={errors.name}
            />
            <Input 
              label="WhatsApp" 
              placeholder="(00) 00000-0000" 
              type="tel"
              value={booking.customer.phone}
              onChange={handlePhoneChange}
              error={errors.phone}
            />
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-surface-200">Observações (opcional)</label>
              <textarea 
                className="w-full bg-surface-950 border border-surface-800 rounded-md px-3 py-2 text-surface-100 placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-colors min-h-[100px]"
                placeholder="Alguma preferência ou observação?"
                value={booking.customer.notes}
                onChange={e => setBooking(prev => ({ ...prev, customer: { ...prev.customer, notes: e.target.value } }))}
              />
            </div>
          </div>
        );

      case 5:
        const selectedBarber = booking.barberId === 'any' ? { name: 'Sem preferência (primeiro disponível)' } : barbers.find(b => b.id === booking.barberId);
        
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-display text-surface-50 mb-6">Resumo do Agendamento</h2>
            
            <Card className="space-y-4">
              <div className="flex justify-between items-start border-b border-surface-800 pb-4">
                <div>
                  <p className="text-sm text-surface-400 mb-1">Data e Hora</p>
                  <p className="font-semibold text-surface-50 flex items-center gap-2">
                    <CalendarIcon size={16} className="text-primary-500" />
                    {booking.date.split('-').reverse().join('/')} · {booking.time} – {addMinutes(booking.time, totalDuration)}
                  </p>
                  <p className="text-xs text-surface-400 mt-1">Duração: {formatDuration(totalDuration)}</p>
                </div>
                <button onClick={() => setCurrentStep(3)} className="text-sm text-primary-500 hover:underline">Editar</button>
              </div>

              <div className="flex justify-between items-start border-b border-surface-800 pb-4">
                <div>
                  <p className="text-sm text-surface-400 mb-1">Profissional</p>
                  <p className="font-semibold text-surface-50 flex items-center gap-2">
                    <User size={16} className="text-primary-500" />
                    {selectedBarber?.name}
                  </p>
                </div>
                <button onClick={() => setCurrentStep(2)} className="text-sm text-primary-500 hover:underline">Editar</button>
              </div>

              <div className="flex justify-between items-start border-b border-surface-800 pb-4">
                <div className="w-full">
                  <div className="flex justify-between w-full mb-2">
                    <p className="text-sm text-surface-400">Serviços</p>
                    <button onClick={() => setCurrentStep(1)} className="text-sm text-primary-500 hover:underline">Editar</button>
                  </div>
                  <ul className="space-y-2 w-full">
                    {selectedServicesList.map(s => (
                      <li key={s.id} className="flex justify-between text-surface-100">
                        <span>{s.name} <span className="text-xs text-surface-500">({formatDuration(s.duration_minutes)})</span></span>
                        <span className="font-medium">{formatPrice(s.price)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="text-lg font-display text-surface-50">Total</span>
                <span className="text-2xl font-bold text-primary-500">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
              </div>
            </Card>

            <Card className="bg-surface-950/50 border-surface-800">
              <div className="flex items-center gap-3 text-surface-200">
                <MapPin size={20} className="text-primary-500 shrink-0" />
                <p className="text-sm">{contactInfo.address}</p>
              </div>
            </Card>
          </div>
        );

      case 6:
        return (
          <div className="text-center py-12 space-y-6">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} />
            </div>
            <h2 className="text-3xl font-display text-surface-50 font-bold">Agendamento Confirmado!</h2>
            <p className="text-surface-300 max-w-sm mx-auto">
              Olá {booking.customer.name.split(' ')[0]}, seu horário foi reservado com sucesso
              {booking.assignedBarberId ? ` com ${barbers.find(b => b.id === booking.assignedBarberId)?.name}` : ''}. Te enviamos um WhatsApp com os detalhes.
            </p>
            
            <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" className="flex items-center justify-center gap-2">
                <CalendarIcon size={18} />
                Adicionar ao Calendário
              </Button>
              <Button variant="primary" onClick={() => onNavigate('home')}>
                Voltar ao Início
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col pb-24 md:pb-0">
      {/* Header Mobile / Desktop Nav */}
      <header className="bg-dark-card border-b border-surface-800 sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          {currentStep < 6 && (
            <button onClick={handleBack} className="p-2 -ml-2 text-surface-300 hover:text-surface-50 transition-colors">
              <ChevronLeft size={24} />
            </button>
          )}
          <div>
            <h1 className="font-display font-bold text-surface-50">Agendar Horário</h1>
            {currentStep < 6 && (
              <p className="text-xs text-primary-500">Etapa {currentStep} de 5: {STEPS[currentStep-1].title}</p>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        {currentStep < 6 && (
          <div className="w-full h-1 bg-surface-900">
            <div 
              className="h-full bg-primary-500 transition-all duration-300 ease-out" 
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        )}
      </header>

      <main className="flex-1 container mx-auto px-4 max-w-2xl py-8">
        {renderStepContent()}
      </main>

      {/* Fixed Bottom Bar for Mobile & Desktop */}
      {currentStep < 6 && (
        <div className="fixed md:sticky bottom-0 left-0 right-0 p-4 bg-dark-card/90 backdrop-blur-md border-t border-surface-800 z-50">
          <div className="container mx-auto max-w-2xl flex justify-between items-center gap-4">
            <div className="hidden sm:block">
              {currentStep === 1 && booking.serviceIds.length > 0 && (
                <span className="text-surface-50 font-bold">
                  Total: R$ {totalPrice.toFixed(2).replace('.', ',')}
                  <span className="ml-3 text-sm font-normal text-surface-400">· {formatDuration(totalDuration)}</span>
                </span>
              )}
            </div>
            <Button 
              variant="primary" 
              className="w-full sm:w-auto px-8 py-3 text-lg font-bold"
              onClick={handleNext}
              disabled={isLoading}
            >
              {isLoading ? 'Processando...' : currentStep === 5 ? 'Confirmar Agendamento' : 'Continuar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

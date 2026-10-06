import React, { useState, useEffect } from 'react';
import { ChevronLeft, Check, Calendar as CalendarIcon, Clock, Scissors, User, MapPin } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { services, barbers, contactInfo } from '../data/mockData';
import { supabase } from '../lib/supabase';

const STEPS = [
  { id: 1, title: 'Serviço' },
  { id: 2, title: 'Profissional' },
  { id: 3, title: 'Data e Hora' },
  { id: 4, title: 'Seus Dados' },
  { id: 5, title: 'Confirmação' },
];

// Mock available times
const availableTimes = ['09:00', '10:00', '11:00', '14:00', '15:30', '17:00', '18:30'];

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
      
      setIsLoading(true);
      
      const insertAppointment = async () => {
        try {
          const { error } = await supabase.from('appointments').insert([
            {
              user_id: user.id,
              customer_name: booking.customer.name,
              customer_phone: booking.customer.phone,
              barber_id: booking.barberId,
              service_ids: booking.serviceIds,
              date: booking.date,
              time: booking.time,
              status: 'upcoming',
              total_price: totalPrice,
              notes: booking.customer.notes || null,
            }
          ]);
          if (error) throw error;
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
      return {
        ...prev,
        serviceIds: isSelected 
          ? prev.serviceIds.filter(sId => sId !== id)
          : [...prev.serviceIds, id]
      };
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
  const totalPrice = selectedServicesList.reduce((acc, curr) => {
    const priceNum = parseFloat(curr.price.replace('R$ ', '').replace(',', '.'));
    return acc + priceNum;
  }, 0);

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
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-bold text-primary-500">{service.price}</span>
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
              <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
                {dates.map(d => (
                  <button
                    key={d.full}
                    disabled={d.disabled}
                    onClick={() => setBooking(prev => ({ ...prev, date: d.full, time: '' }))}
                    className={`flex-shrink-0 w-20 h-24 rounded-lg flex flex-col items-center justify-center border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg ${
                      d.disabled 
                        ? 'opacity-30 cursor-not-allowed border-surface-800 bg-surface-900/50'
                        : booking.date === d.full 
                          ? 'border-primary-500 bg-primary-500 text-surface-950' 
                          : 'border-surface-700 bg-surface-900 hover:border-primary-500/50 text-surface-100'
                    }`}
                  >
                    <span className="text-xs uppercase font-medium mb-1">{d.weekday}</span>
                    <span className="text-2xl font-bold font-display">{d.day}</span>
                  </button>
                ))}
              </div>
            </div>

            {booking.date && (
              <div>
                <p className="text-sm text-surface-300 mb-4">Horários disponíveis:</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {availableTimes.map(time => (
                    <button
                      key={time}
                      onClick={() => setBooking(prev => ({ ...prev, time }))}
                      className={`py-3 rounded-md border text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg ${
                        booking.time === time
                          ? 'border-primary-500 bg-primary-500 text-surface-950'
                          : 'border-surface-700 bg-surface-900 hover:border-primary-500/50 text-surface-100'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
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
        const selectedBarber = booking.barberId === 'any' ? { name: 'Sem preferência' } : barbers.find(b => b.id === booking.barberId);
        
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-display text-surface-50 mb-6">Resumo do Agendamento</h2>
            
            <Card className="space-y-4">
              <div className="flex justify-between items-start border-b border-surface-800 pb-4">
                <div>
                  <p className="text-sm text-surface-400 mb-1">Data e Hora</p>
                  <p className="font-semibold text-surface-50 flex items-center gap-2">
                    <CalendarIcon size={16} className="text-primary-500" />
                    {booking.date.split('-').reverse().join('/')} às {booking.time}
                  </p>
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
                        <span>{s.name}</span>
                        <span className="font-medium">{s.price}</span>
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
              Olá {booking.customer.name.split(' ')[0]}, seu horário foi reservado com sucesso. Te enviamos um WhatsApp com os detalhes.
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
                <span className="text-surface-50 font-bold">Total: R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
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

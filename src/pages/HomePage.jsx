import React from 'react';
import { Header } from '../components/layout/Header';
import { Section } from '../components/ui/Section';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Clock, Scissors, MapPin, Phone, Star, MessageCircle } from 'lucide-react';
import { barbers, gallery, contactInfo } from '../data/mockData';
import { useFadeIn } from '../hooks/useFadeIn';
import { useServices, formatPrice, formatDuration } from '../hooks/useServices';

// Animated wrapper component
const FadeInSection = ({ children, className = '' }) => {
  const { ref, isVisible } = useFadeIn(0.1);
  return (
    <div 
      ref={ref} 
      className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  );
};

function HomePage({ onNavigate, user }) {
  const { services } = useServices();
  // Override mock data for the generated image
  const displayBarbers = [...barbers];
  displayBarbers[0] = { ...displayBarbers[0], photo: '/barber-1.jpg' };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-dark-bg text-surface-100 scroll-smooth">
      <Header onNavigate={onNavigate} user={user} />
      
      <main className="flex-1">
        {/* 1. Hero Section */}
        <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="/hero-bg.jpg" 
              alt="Barbearia Fio a Fio" 
              className="w-full h-full object-cover object-center opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/80 to-transparent" />
          </div>
          
          <div className="container mx-auto px-4 z-10 text-center max-w-3xl mt-12">
            <FadeInSection>
              <Badge variant="primary" className="mb-6 px-4 py-1 text-sm uppercase tracking-widest">
                Experiência Premium
              </Badge>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold text-surface-50 mb-6 drop-shadow-lg leading-tight">
                Seu estilo, <span className="text-primary-500">nossa assinatura.</span>
              </h1>
              <p className="text-lg md:text-xl text-surface-300 mb-10 max-w-2xl mx-auto">
                Mais do que um corte, um ritual de cuidado masculino no coração da cidade.
              </p>
              <Button variant="primary" onClick={() => onNavigate('booking')} className="text-lg px-8 py-4 shadow-gold hover:-translate-y-1 transition-transform">
                Agendar Meu Horário
              </Button>
            </FadeInSection>
          </div>
        </section>

        {/* 2. Serviços */}
        <Section title="Nossos Serviços" subtitle="O que oferecemos" id="servicos">
          <FadeInSection className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="flex flex-col h-full hover:border-primary-500/50 transition-colors group">
                <div className="flex-1">
                  <h3 className="text-xl font-display text-surface-50 mb-2 group-hover:text-primary-400 transition-colors">{service.name}</h3>
                  <p className="text-surface-400 text-sm mb-6">{service.description}</p>
                </div>
                <div className="mt-auto border-t border-surface-800 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-primary-500">{formatPrice(service.price)}</span>
                    <span className="text-xs text-surface-400 flex items-center gap-1 bg-surface-900 px-2 py-1 rounded-md border border-surface-800"><Clock size={12}/> {formatDuration(service.duration_minutes)}</span>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => onNavigate('booking')}>Agendar</Button>
                </div>
              </Card>
            ))}
          </FadeInSection>
        </Section>

        {/* 3. Barbeiros */}
        <Section title="Nossos Mestres" subtitle="Profissionais" className="bg-surface-950" id="barbeiros">
          <FadeInSection className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
            {displayBarbers.map((barber) => (
              <Card key={barber.id} className="p-0 overflow-hidden border-none bg-surface-900 group">
                <div className="h-80 w-full overflow-hidden">
                  <img 
                    src={barber.photo} 
                    alt={barber.name} 
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 grayscale group-hover:grayscale-0"
                  />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-display text-surface-50 mb-1">{barber.name}</h3>
                  <p className="text-primary-500 text-sm">{barber.specialty}</p>
                </div>
              </Card>
            ))}
          </FadeInSection>
        </Section>

        {/* 4. Galeria */}
        <Section title="Nossa Arte" subtitle="Galeria">
          <FadeInSection className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gallery.map((img, idx) => (
              <div key={idx} className="aspect-square overflow-hidden rounded-lg group">
                <img 
                  src={img} 
                  alt={`Trabalho ${idx + 1}`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                />
              </div>
            ))}
          </FadeInSection>
        </Section>


        {/* 6. Localização */}
        <Section id="contato">
          <FadeInSection className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-primary-500 font-semibold tracking-wider uppercase text-sm mb-2">Venha nos visitar</p>
              <h2 className="text-3xl md:text-4xl text-surface-50 mb-8 font-display font-bold">Localização e Horários</h2>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-900/30 flex items-center justify-center text-primary-500 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4 className="text-surface-100 font-semibold mb-1">Endereço</h4>
                    <p className="text-surface-400 text-sm leading-relaxed">{contactInfo.address}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-900/30 flex items-center justify-center text-primary-500 shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="text-surface-100 font-semibold mb-1">Horário de Funcionamento</h4>
                    <p className="text-surface-400 text-sm leading-relaxed whitespace-pre-line">{contactInfo.hours}</p>
                  </div>
                </div>
              </div>

              <Button variant="primary" className="w-full sm:w-auto flex items-center gap-2">
                <MessageCircle size={18} />
                Chamar no WhatsApp
              </Button>
            </div>

            <div className="h-80 md:h-full min-h-[400px] bg-surface-900 rounded-xl border border-surface-800 overflow-hidden relative group flex items-center justify-center">
              {/* Map Placeholder */}
              <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center" />
              <div className="z-10 text-center p-6">
                <MapPin className="h-12 w-12 text-primary-500 mx-auto mb-4" />
                <h3 className="text-xl font-display text-surface-50 mb-2">Mapa Interativo</h3>
                <p className="text-surface-400 text-sm mb-4">Integração com Google Maps entrará aqui.</p>
                <Button variant="outline" size="sm">Ver no Google Maps</Button>
              </div>
            </div>
          </FadeInSection>
        </Section>
      </main>

      {/* 7. Footer */}
      <footer className="bg-surface-950 border-t border-surface-900 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-primary-500 mb-6">
            <Scissors className="h-8 w-8" />
            <span className="text-xl font-bold tracking-tight text-surface-50 font-display">FIO A FIO</span>
          </div>
          <p className="text-surface-400 text-sm mb-8 max-w-md mx-auto">
            A verdadeira barbearia clássica, com o toque de modernidade e excelência que você merece.
          </p>
          <div className="flex items-center justify-center gap-4 mb-8">
            <a href="#" className="w-10 h-10 rounded-full bg-surface-900 flex items-center justify-center text-surface-400 hover:text-primary-500 hover:bg-surface-800 transition-colors">
              Ig
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-surface-900 flex items-center justify-center text-surface-400 hover:text-primary-500 hover:bg-surface-800 transition-colors">
              Fb
            </a>
          </div>
          <p className="text-surface-600 text-xs">
            &copy; {new Date().getFullYear()} Barbearia Fio a Fio. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;

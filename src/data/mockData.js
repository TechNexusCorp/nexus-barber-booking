// Fallback local — a fonte oficial é a tabela `services` do Supabase (editável no painel do admin)
export const services = [
  {
    id: 1,
    name: 'Corte Clássico',
    description: 'Corte na tesoura ou máquina com finalização impecável.',
    duration_minutes: 10,
    price: 45,
    combo_of: [],
    active: true,
    sort_order: 1
  },
  {
    id: 2,
    name: 'Barba',
    description: 'Aparação, toalha quente, massagem facial e óleos essenciais.',
    duration_minutes: 10,
    price: 35,
    combo_of: [],
    active: true,
    sort_order: 2
  },
  {
    id: 3,
    name: 'Corte + Barba',
    description: 'O combo completo para o seu visual, com desconto especial.',
    duration_minutes: 20,
    price: 70,
    combo_of: [1, 2],
    active: true,
    sort_order: 3
  },
  {
    id: 4,
    name: 'Sobrancelha',
    description: 'Alinhamento e limpeza na navalha.',
    duration_minutes: 5,
    price: 15,
    combo_of: [],
    active: true,
    sort_order: 4
  }
];

export const barbers = [
  {
    id: 1,
    name: 'Krech',
    specialty: 'Especialista em Degradê',
    photo: '/barbeiro-krech.jpeg'
  },
  {
    id: 2,
    name: 'Vitinho',
    specialty: 'Mestre das Tesouras',
    photo: '/barbeiro-vitinho.jpeg'
  },
  {
    id: 3,
    name: 'Mikael',
    specialty: 'Especialista em Barba',
    photo: '/barbeiro-mikael.jpeg'
  }
];
const galleryModules = import.meta.glob('../assets/gallery/*.{png,jpg,jpeg,webp,gif,svg}', { eager: true, import: 'default' });
export const gallery = Object.values(galleryModules);

export const contactInfo = {
  address: 'Rua Cel. Vitor Vila Verde, 491 - Santo Antônio da Patrulha, RS',
  phone: '(51) 98062-8005',
  hours: 'Terça a Sábado: 08:00 - 12:00 / 13:00 - 19:30\nDomingo e Segunda: Fechado'
};

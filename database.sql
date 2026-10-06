-- Criação da tabela de Agendamentos
CREATE TABLE public.appointments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users NOT NULL,
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    barber_id text NOT NULL,
    service_ids text[] NOT NULL,
    date date NOT NULL,
    time text NOT NULL,
    status text DEFAULT 'upcoming'::text NOT NULL, -- 'upcoming', 'completed', 'cancelled'
    total_price numeric NOT NULL,
    notes text
);

-- Ativar Row Level Security (RLS)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver seus próprios agendamentos
CREATE POLICY "Users can view their own appointments"
ON public.appointments FOR SELECT
USING (auth.uid() = user_id);

-- Política: Usuários podem inserir seus próprios agendamentos
CREATE POLICY "Users can insert their own appointments"
ON public.appointments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- (Opcional) Política para o admin ver TODOS os agendamentos.
-- Assumindo que você usa o metadata do auth.users para definir quem é admin.
-- Exemplo: você pode rodar isso no painel SQL para um usuário específico:
-- UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}' WHERE email = 'seu_email@admin.com';
CREATE POLICY "Admins can view all appointments"
ON public.appointments FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
);

CREATE POLICY "Admins can update appointments"
ON public.appointments FOR UPDATE
USING (
  (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
);

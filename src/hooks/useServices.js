import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { services as fallbackServices } from '../data/mockData';

export const formatPrice = (value) =>
  `R$ ${Number(value || 0).toFixed(2).replace('.', ',').replace(',00', '')}`;

export const formatDuration = (minutes) => {
  const m = Number(minutes) || 0;
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}h ${rest}min` : `${h}h`;
};

const normalize = (s) => ({
  ...s,
  id: Number(s.id),
  price: Number(s.price),
  duration_minutes: Number(s.duration_minutes),
  combo_of: (s.combo_of || []).map(Number),
});

/**
 * Carrega os serviços do Supabase (tabela `services`).
 * Se a tabela ainda não existir / falhar, usa o catálogo local.
 * @param {{ includeInactive?: boolean }} options
 */
export function useServices({ includeInactive = false } = {}) {
  const [services, setServices] = useState(() =>
    fallbackServices.filter(s => includeInactive || s.active).map(normalize)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('services').select('*').order('sort_order').order('id');
      if (!includeInactive) query = query.eq('active', true);
      const { data, error: err } = await query;
      if (err) throw err;
      if (data && data.length > 0) setServices(data.map(normalize));
      setError(null);
    } catch (err) {
      console.warn('Usando catálogo local de serviços:', err?.message);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => { refresh(); }, [refresh]);

  return { services, loading, error, refresh };
}

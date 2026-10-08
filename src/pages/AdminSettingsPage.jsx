import React, { useEffect, useState } from 'react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Settings, Plus, Save, Clock, Layers, EyeOff, Eye, ShieldAlert, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useServices, formatPrice, formatDuration } from '../hooks/useServices';
import { SHIFTS } from '../lib/schedule';
import { MediaSettings } from '../components/admin/MediaSettings';

const DURATION_OPTIONS = Array.from({ length: 24 }, (_, i) => (i + 1) * 5); // 5 .. 120 min

const emptyService = () => ({
  _draftId: `draft-${Date.now()}-${Math.random()}`,
  name: '',
  description: '',
  duration_minutes: 10,
  price: 0,
  combo_of: [],
  active: true,
  sort_order: 99,
});

export default function AdminSettingsPage({ onNavigate, user }) {
  const isAdmin = user?.user_metadata?.is_admin === true;
  const { services, loading, error: loadError, refresh } = useServices({ includeInactive: true });
  const [drafts, setDrafts] = useState([]);
  const [savingKey, setSavingKey] = useState(null);
  const [feedback, setFeedback] = useState(null); // { key, type, text }
  const [activeTab, setActiveTab] = useState('services');

  useEffect(() => {
    setDrafts(services.map(s => ({ ...s, combo_of: [...(s.combo_of || [])] })));
  }, [services]);

  const keyOf = (s) => s.id ?? s._draftId;

  const updateDraft = (key, patch) => {
    setDrafts(prev => prev.map(s => (keyOf(s) === key ? { ...s, ...patch } : s)));
  };

  const toggleComboPart = (key, partId) => {
    setDrafts(prev => prev.map(s => {
      if (keyOf(s) !== key) return s;
      const has = s.combo_of.includes(partId);
      return { ...s, combo_of: has ? s.combo_of.filter(p => p !== partId) : [...s.combo_of, partId] };
    }));
  };

  const isDirty = (draft) => {
    if (!draft.id) return true;
    const original = services.find(s => s.id === draft.id);
    if (!original) return true;
    return ['name', 'description', 'duration_minutes', 'price', 'active', 'sort_order'].some(f => String(original[f]) !== String(draft[f])) ||
      [...original.combo_of].sort().join(',') !== [...draft.combo_of].sort().join(',');
  };

  const saveService = async (draft) => {
    const key = keyOf(draft);
    if (!draft.name.trim()) {
      setFeedback({ key, type: 'error', text: 'Informe o nome do serviço.' });
      return;
    }
    setSavingKey(key);
    setFeedback(null);

    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      duration_minutes: Number(draft.duration_minutes),
      price: Number(draft.price),
      combo_of: draft.combo_of,
      active: draft.active,
      sort_order: Number(draft.sort_order) || 0,
    };

    try {
      const query = draft.id
        ? supabase.from('services').update(payload).eq('id', draft.id).select()
        : supabase.from('services').insert([payload]).select();
      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Bloqueado pelo banco (sem permissão de admin).');

      setFeedback({ key: data[0].id, type: 'success', text: 'Salvo!' });
      await refresh();
      setTimeout(() => setFeedback(null), 2000);
    } catch (err) {
      console.error('Erro ao salvar serviço:', err);
      setFeedback({ key, type: 'error', text: err.message || 'Erro ao salvar.' });
    } finally {
      setSavingKey(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-dark-bg text-surface-100">
        <Header onNavigate={onNavigate} user={user} />
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-sm text-center">
            <ShieldAlert size={40} className="text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-surface-50 mb-2">Acesso restrito</h1>
            <p className="text-surface-400 text-sm mb-6">Apenas administradores podem acessar as configurações.</p>
            <Button variant="primary" onClick={() => onNavigate('home')}>Voltar ao início</Button>
          </Card>
        </main>
      </div>
    );
  }

  const singleServices = drafts.filter(s => s.id && (!s.combo_of || s.combo_of.length === 0));

  return (
    <div className="min-h-screen flex flex-col font-sans bg-dark-bg text-surface-100">
      <Header onNavigate={onNavigate} user={user} />

      <main className="flex-1 container mx-auto px-4 max-w-4xl py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-surface-50 mb-2 flex items-center gap-3">
              <Settings className="text-primary-500" /> Configurações
            </h1>
            <p className="text-surface-400">Gerencie serviços, barbeiros e fotos do site.</p>
          </div>
          {activeTab === 'services' && (
            <Button
              id="add-service-btn"
              variant="primary"
              className="flex items-center gap-2"
              onClick={() => setDrafts(prev => [emptyService(), ...prev])}
            >
              <Plus size={18} /> Novo serviço
            </Button>
          )}
        </div>

        <div className="flex border-b border-surface-800 mb-8">
          <button 
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'services' ? 'border-primary-500 text-primary-500' : 'border-transparent text-surface-400 hover:text-surface-100'}`}
            onClick={() => setActiveTab('services')}
          >
            Serviços
          </button>
          <button 
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'media' ? 'border-primary-500 text-primary-500' : 'border-transparent text-surface-400 hover:text-surface-100'}`}
            onClick={() => setActiveTab('media')}
          >
            Barbeiros e Galeria
          </button>
        </div>

        {loadError && activeTab === 'services' && (
          <div className="mb-6 p-4 rounded-lg bg-amber-950/40 border border-amber-800 text-amber-300 text-sm">
            A tabela <code>services</code> ainda não existe no Supabase — rode o script de migração para poder salvar.
          </div>
        )}

        {activeTab === 'media' ? (
          <MediaSettings />
        ) : (
          <>
            <Card className="mb-8 bg-surface-950/50">
              <p className="text-sm text-surface-300 flex items-center gap-2">
                <Clock size={16} className="text-primary-500" />
                Expediente: {SHIFTS.map(s => `${s.label} ${s.start}–${s.end}`).join(' · ')} · Grade de 5 em 5 min
              </p>
            </Card>

            {loading && drafts.length === 0 ? (
              <p className="text-surface-400 text-center py-12">Carregando...</p>
            ) : (
              <div className="space-y-6">
                {drafts.map(draft => {
                  const key = keyOf(draft);
                  const dirty = isDirty(draft);
                  const isCombo = draft.combo_of.length > 0;
                  const fb = feedback && feedback.key === key ? feedback : null;
                  return (
                    <Card
                      key={key}
                      className={`relative overflow-hidden transition-all ${!draft.active ? 'opacity-60' : ''} ${dirty ? 'border-primary-500/40' : ''}`}
                    >
                      <div className={`absolute top-0 left-0 w-1 h-full ${draft.active ? 'bg-primary-500' : 'bg-surface-700'}`} />

                      <div className="flex items-center justify-between mb-5 gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg font-semibold text-surface-50">{draft.name || 'Novo serviço'}</span>
                          {isCombo && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-900/20 text-primary-500 border border-primary-500/20 flex items-center gap-1">
                              <Layers size={12} /> Combo
                            </span>
                          )}
                          {!draft.active && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-800 text-surface-400 border border-surface-700">Oculto</span>
                          )}
                        </div>
                        <span className="text-sm text-surface-400 whitespace-nowrap">
                          {formatPrice(draft.price)} · {formatDuration(draft.duration_minutes)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          id={`service-name-${key}`}
                          label="Nome"
                          value={draft.name}
                          onChange={e => updateDraft(key, { name: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor={`service-duration-${key}`} className="text-sm font-medium text-surface-200">Duração</label>
                            <select
                              id={`service-duration-${key}`}
                              value={draft.duration_minutes}
                              onChange={e => updateDraft(key, { duration_minutes: Number(e.target.value) })}
                              className="w-full bg-surface-950 border border-surface-800 rounded-md px-3 py-2 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                            >
                              {DURATION_OPTIONS.map(m => <option key={m} value={m}>{formatDuration(m)}</option>)}
                            </select>
                          </div>
                          <Input
                            id={`service-price-${key}`}
                            label="Preço (R$)"
                            type="text"
                            value={Number(draft.price || 0).toFixed(2).replace('.', ',')}
                            onChange={e => {
                              const digits = e.target.value.replace(/\D/g, '');
                              const numValue = digits ? (parseInt(digits, 10) / 100) : 0;
                              updateDraft(key, { price: numValue });
                            }}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Input
                            id={`service-desc-${key}`}
                            label="Descrição"
                            value={draft.description}
                            onChange={e => updateDraft(key, { description: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-sm font-medium text-surface-200 mb-2">É um combo de: <span className="text-surface-500 font-normal">(ao marcar o combo, os avulsos são desmarcados)</span></p>
                        <div className="flex flex-wrap gap-2">
                          {singleServices.filter(s => s.id !== draft.id).map(part => {
                            const active = draft.combo_of.includes(part.id);
                            return (
                              <button
                                key={part.id}
                                type="button"
                                onClick={() => toggleComboPart(key, part.id)}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${active ? 'bg-primary-500 border-primary-500 text-surface-950 font-semibold' : 'border-surface-700 text-surface-300 hover:border-primary-500/50'}`}
                              >
                                {active && <Check size={12} />} {part.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-surface-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => updateDraft(key, { active: !draft.active })}
                          className="text-sm text-surface-400 hover:text-surface-100 flex items-center gap-2 transition-colors"
                        >
                          {draft.active ? <><EyeOff size={16} /> Ocultar dos clientes</> : <><Eye size={16} /> Mostrar para os clientes</>}
                        </button>
                        <div className="flex items-center gap-3">
                          {fb && (
                            <span className={`text-sm ${fb.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>{fb.text}</span>
                          )}
                          {!draft.id && (
                            <Button variant="outline" onClick={() => setDrafts(prev => prev.filter(s => keyOf(s) !== key))}>Descartar</Button>
                          )}
                          <Button
                            id={`save-service-${key}`}
                            variant="primary"
                            className="flex items-center gap-2"
                            disabled={!dirty || savingKey === key}
                            onClick={() => saveService(draft)}
                          >
                            <Save size={16} /> {savingKey === key ? 'Salvando...' : 'Salvar'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

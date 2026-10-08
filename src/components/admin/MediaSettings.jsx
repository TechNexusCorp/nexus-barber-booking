import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Upload, Trash2, Image as ImageIcon, Save } from 'lucide-react';

export function MediaSettings() {
  const [barbers, setBarbers] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [barbersRes, galleryRes] = await Promise.all([
        supabase.from('barbers').select('*').order('id'),
        supabase.from('gallery').select('*').order('created_at', { ascending: false })
      ]);
      if (barbersRes.data) setBarbers(barbersRes.data);
      if (galleryRes.data) setGallery(galleryRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, []);

  const handleUpload = async (file, folder) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    setUploading(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      setFeedback({ type: 'error', text: 'Erro no upload: ' + error.message });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const saveBarber = async (barber, newPhotoFile) => {
    setFeedback(null);
    let photoUrl = barber.photo_url;

    if (newPhotoFile) {
      const uploadedUrl = await handleUpload(newPhotoFile, 'barbers');
      if (!uploadedUrl) return; // Error already set
      photoUrl = uploadedUrl;
    }

    try {
      const payload = {
        name: barber.name,
        specialty: barber.specialty,
        photo_url: photoUrl
      };

      if (barber.id) {
        await supabase.from('barbers').update(payload).eq('id', barber.id);
      } else {
        await supabase.from('barbers').insert([payload]);
      }
      setFeedback({ type: 'success', text: 'Barbeiro salvo com sucesso!' });
      fetchData();
    } catch (error) {
      setFeedback({ type: 'error', text: 'Erro ao salvar: ' + error.message });
    }
  };

  const uploadGallery = async (file) => {
    const url = await handleUpload(file, 'gallery');
    if (!url) return;

    try {
      await supabase.from('gallery').insert([{ image_url: url }]);
      setFeedback({ type: 'success', text: 'Imagem adicionada à galeria!' });
      fetchData();
    } catch (error) {
      setFeedback({ type: 'error', text: 'Erro ao salvar na galeria.' });
    }
  };

  const deleteGalleryImage = async (id) => {
    try {
      await supabase.from('gallery').delete().eq('id', id);
      fetchData();
    } catch (error) {
      setFeedback({ type: 'error', text: 'Erro ao remover imagem.' });
    }
  };

  const deleteBarber = async (id) => {
    try {
      await supabase.from('barbers').delete().eq('id', id);
      fetchData();
    } catch (error) {
      setFeedback({ type: 'error', text: 'Erro ao remover barbeiro.' });
    }
  };

  if (loading) return <p className="text-surface-400 py-8">Carregando dados da mídia...</p>;

  return (
    <div className="space-y-12">
      {feedback && (
        <div className={`p-4 rounded-lg border ${feedback.type === 'error' ? 'bg-red-950/40 border-red-800 text-red-300' : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'}`}>
          {feedback.text}
        </div>
      )}

      {/* Barbeiros */}
      <section>
        <h2 className="text-2xl font-display font-bold text-surface-50 mb-6">Barbeiros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {barbers.map(barber => (
            <BarberEditor key={barber.id || Math.random()} barber={barber} onSave={saveBarber} onDelete={() => deleteBarber(barber.id)} uploading={uploading} />
          ))}
          {/* Adicionar novo barbeiro */}
          <BarberEditor barber={{ name: '', specialty: '', photo_url: '' }} onSave={saveBarber} uploading={uploading} isNew />
        </div>
      </section>

      {/* Galeria */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold text-surface-50">Nossa Arte (Galeria)</h2>
          <label className="bg-primary-500 hover:bg-primary-400 text-dark-bg px-4 py-2 rounded-md font-semibold cursor-pointer flex items-center gap-2 transition-colors">
            <Upload size={18} /> {uploading ? 'Enviando...' : 'Adicionar Foto'}
            <input type="file" className="hidden" accept="image/*" onChange={(e) => uploadGallery(e.target.files[0])} disabled={uploading} />
          </label>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {gallery.map(img => (
            <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-surface-900 border border-surface-800">
              <img src={img.image_url} alt="Galeria" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={() => deleteGalleryImage(img.id)}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
          {gallery.length === 0 && (
            <p className="text-surface-400 col-span-full">Nenhuma imagem na galeria ainda.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function BarberEditor({ barber, onSave, onDelete, uploading, isNew }) {
  const [name, setName] = useState(barber.name);
  const [specialty, setSpecialty] = useState(barber.specialty);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(barber.photo_url);

  useEffect(() => {
    if (isNew) return;
    if (name !== barber.name || specialty !== barber.specialty) {
      const timer = setTimeout(() => {
        onSave({ ...barber, name, specialty }, file);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [name, specialty, barber, file, isNew, onSave]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      if (!isNew) {
        onSave({ ...barber, name, specialty }, f);
      }
    }
  };

  return (
    <Card className="bg-surface-950 flex flex-col gap-4 border border-surface-800">
      <div className="aspect-square bg-surface-900 rounded-lg overflow-hidden flex items-center justify-center relative border border-surface-700">
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={40} className="text-surface-600" />
        )}
        <label className="absolute bottom-2 right-2 bg-dark-bg/80 backdrop-blur text-surface-50 p-2 rounded-md border border-surface-700 cursor-pointer hover:bg-surface-800 transition-colors">
          <Upload size={16} />
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
      </div>
      
      <Input label="Nome" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Gabriel, Vitinho..." />
      <Input label="Especialidade" value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="Ex: Degradê" />
      
      <div className="flex gap-2 mt-2">
        {!isNew ? (
          <Button 
            variant="outline" 
            className="w-full text-red-500 hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/20" 
            disabled={uploading}
            onClick={onDelete}
          >
            <Trash2 size={16} className="inline mr-2" /> Excluir Barbeiro
          </Button>
        ) : (
          <Button 
            variant="outline" 
            className="w-full" 
            disabled={uploading || (!name.trim())}
            onClick={() => {
              onSave({ ...barber, name, specialty }, file);
              setName('');
              setSpecialty('');
              setFile(null);
              setPreview(null);
            }}
          >
            <Save size={16} className="inline mr-2" /> Adicionar Novo
          </Button>
        )}
      </div>
    </Card>
  );
}

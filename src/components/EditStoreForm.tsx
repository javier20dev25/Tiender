// src/components/EditStoreForm.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X, Store, Image as ImageIcon, Users, Save,
  Upload, AlertCircle, Info, BadgeCheck
} from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import type { Store as StoreType } from '../types';

interface EditStoreFormProps {
  store: StoreType;
  onClose: () => void;
  onStoreUpdated: () => void;
}

const EditStoreForm: React.FC<EditStoreFormProps> = ({ store, onClose, onStoreUpdated }) => {
  const [name, setName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [communityLink, setCommunityLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (store) {
      setName(store.name);
      setCurrentLogoUrl(store.logo_url);
      setCommunityLink(store.community_link || '');
    }
  }, [store]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre de la tienda es obligatorio.');
      return;
    }

    try {
      console.log('[EditStoreForm] Iniciando guardado de tienda:', { name, currentLogoUrl, hasNewLogo: !!logoFile });
      if (logoFile) {
        console.log('[EditStoreForm] Subiendo nuevo logo...');
        const fileExtension = logoFile.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const filePath = `${store.id}/${fileName}`;

        const { error: uploadError } = await getSupabase().storage
          .from('store-logos')
          .upload(filePath, logoFile, { upsert: true });

        if (uploadError) {
          console.error('[EditStoreForm] Error al subir logo:', uploadError);
          throw uploadError;
        }

        const { data: publicData } = getSupabase().storage
          .from('store-logos')
          .getPublicUrl(filePath);
          
        newLogoUrl = publicData.publicUrl;
        console.log('[EditStoreForm] Logo subido con éxito:', newLogoUrl);
      }

      console.log('[EditStoreForm] Actualizando datos en tabla "stores"...');
      const { data: updateData, error: updateError } = await getSupabase()
        .from('stores')
        .update({
          name: name.trim(),
          logo_url: newLogoUrl,
          community_link: communityLink.trim(),
        })
        .eq('id', store.id)
        .select();

      if (updateError) {
        console.error('[EditStoreForm] Error al actualizar stores:', updateError);
        throw updateError;
      }

      console.log('[EditStoreForm] Actualización exitosa:', updateData);
      onStoreUpdated();
      onClose();
    } catch (error: any) {
      console.error('[EditStoreForm] Error fatal:', error);
      setError(error.message || 'Error al actualizar la tienda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full bg-zinc-800/50 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-neon/50 focus:border-brand-neon/50 transition-all text-sm";
  const labelClasses = "flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-2";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-zinc-900 border border-white/5 rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-neon/10 flex items-center justify-center text-brand-neon">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Identidad Visual</h2>
              <p className="text-zinc-500 text-xs font-medium">Configura la marca de tu negocio</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl bg-zinc-800 text-zinc-400 hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto custom-scrollbar p-8 space-y-8">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <div className="p-4 bg-brand-neon/5 border border-brand-neon/20 rounded-2xl flex items-start gap-4">
            <div className="p-2 bg-brand-neon text-brand-dark rounded-xl mt-1"><Info className="w-4 h-4" /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-neon/70 mb-1">WhatsApp Vinculado</p>
              <p className="text-sm font-bold text-white break-all">{store.whatsapp_number}</p>
              <p className="text-[10px] text-zinc-500 font-medium mt-1">Este número es el canal principal de tus ventas y no puede modificarse.</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-zinc-800 bg-zinc-800/30 overflow-hidden relative group shadow-2xl ring-4 ring-black/50">
                {(logoPreview || currentLogoUrl) ? (
                  <img src={logoPreview || currentLogoUrl || ''} alt="Store Logo" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                )}
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                  <Upload className="w-6 h-6 text-white mb-1" />
                  <span className="text-[9px] font-black text-white uppercase">Cambiar</span>
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
              </div>
              {logoPreview && (
                <div className="absolute -bottom-2 -right-2 p-2 bg-brand-neon text-brand-dark rounded-full shadow-lg">
                  <BadgeCheck className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="w-full space-y-6 text-left">
              <div>
                <label className={labelClasses}><Store className="w-3.5 h-3.5" /> Nombre Comercial</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Mi Tienda Online" className={inputClasses} required />
              </div>

              {store.plan_type === 'full' && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <label className={labelClasses}><Users className="w-3.5 h-3.5" /> Comunidad / Grupo</label>
                    <div className="px-2 py-0.5 bg-brand-yellow/10 text-brand-yellow rounded-md text-[8px] font-black uppercase tracking-widest border border-brand-yellow/20">Plan Full</div>
                  </div>
                  <input type="url" value={communityLink} onChange={(e) => setCommunityLink(e.target.value)} placeholder="https://chat.whatsapp.com/..." className={inputClasses} />
                  <p className="text-[10px] text-zinc-500 font-medium italic">Añade un enlace para fidelizar a tus clientes en un grupo VIP.</p>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-8 bg-zinc-950 border-t border-white/5 flex items-center justify-end gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <button type="button" onClick={onClose} className="px-8 py-4 rounded-2xl text-zinc-400 font-bold hover:text-white transition-colors uppercase tracking-widest text-xs">Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-10 py-4 rounded-[20px] bg-brand-neon text-brand-dark font-black uppercase tracking-tighter italic flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
          >
            {isSubmitting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-brand-dark border-t-transparent rounded-full" /> : <Save className="w-5 h-5" />}
            <span>{isSubmitting ? 'Guardando' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EditStoreForm;

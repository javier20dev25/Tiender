// src/components/EditStoreForm.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import type { Store } from '../types';

interface EditStoreFormProps {
  store: Store & { whatsapp_number: string; plan_type: string; community_link?: string | null; };
  onClose: () => void;
  onStoreUpdated: () => void;
}

const EditStoreForm: React.FC<EditStoreFormProps> = ({ store, onClose, onStoreUpdated }) => {
  const [name, setName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre de la tienda es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    let newLogoUrl = currentLogoUrl;

    try {
      // 1. Handle Logo Upload/Update
      if (logoFile) {
        const fileExtension = logoFile.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const filePath = `${store.id}/${fileName}`;

        // Unlike product images, we can upsert/overwrite the store logo
        const { error: uploadError } = await supabase.storage
          .from('store-logos')
          .upload(filePath, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        // Construct the new public URL manually for stability
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        newLogoUrl = `${supabaseUrl}/storage/v1/object/public/store-logos/${filePath}`;
      
      }

      // 2. Update Store Details in Database
      const { error: updateError } = await supabase
        .from('stores')
        .update({
          name: name.trim(),
          logo_url: newLogoUrl,
          community_link: communityLink.trim(),
        })
        .eq('id', store.id);

      if (updateError) {
        throw updateError;
      }

      // 3. Success: Refresh and Close
      onStoreUpdated();
      onClose();

    } catch (error: unknown) {
      console.error('Error updating store:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ocurrió un error al actualizar la tienda.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Editar Tienda</h2>
        <p className="text-sm text-left text-gray-600 mb-4 border-l-4 border-blue-500 pl-3">
          Tu número de WhatsApp <span className="font-semibold">{store.whatsapp_number}</span> está vinculado a tu cuenta y no se puede cambiar.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 text-left">Nombre de la Tienda</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
          </div>
          
          <div className="mb-6">
            <label htmlFor="logo" className="block text-sm font-medium text-gray-700 text-left">Logo de la Tienda</label>
            {currentLogoUrl && !logoFile && (
              <div className="mt-2 mb-4 text-center">
                <img src={currentLogoUrl} alt="Current Logo" className="h-20 w-20 object-cover rounded-full inline-block" />
                <p className="text-sm text-gray-500">Logo actual</p>
              </div>
            )}
            <input id="logo" type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files ? e.target.files[0] : null)} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            {!currentLogoUrl && !logoFile && <p className="text-sm text-gray-500 mt-1">Sube un logo para tu tienda.</p>}
          </div>

          {store.plan_type === 'full' && (
            <div className="mb-6">
              <label htmlFor="communityLink" className="block text-sm font-medium text-gray-700 text-left">Enlace a tu Comunidad (Opcional)</label>
              <p className="text-xs text-gray-500 text-left mb-1">Añade un enlace a tu grupo de WhatsApp, Telegram, etc. para capturar clientes.</p>
              <input id="communityLink" type="url" value={communityLink} onChange={(e) => setCommunityLink(e.target.value)} placeholder="https://chat.whatsapp.com/..." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
          )}
          
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          
          <div className="flex items-center justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStoreForm;

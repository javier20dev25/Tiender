// src/components/EditStoreForm.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

interface Store {
  id: string;
  name: string;
  logo_url: string | null;
  whatsapp_number: string;
}

interface EditStoreFormProps {
  store: Store;
  onClose: () => void;
  onStoreUpdated: () => void;
}

const EditStoreForm: React.FC<EditStoreFormProps> = ({ store, onClose, onStoreUpdated }) => {
  const [name, setName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (store) {
      setName(store.name);
      setWhatsappNumber(store.whatsapp_number);
      setCurrentLogoUrl(store.logo_url);
    }
  }, [store]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !whatsappNumber.trim()) {
      setError('El nombre de la tienda y el número de WhatsApp son obligatorios.');
      return;
    }

    setIsSubmitting(true);
    let newLogoUrl = currentLogoUrl;

    try {
      // 1. Handle Logo Upload/Update
      if (logoFile) {
        // Delete old logo if it exists
        if (currentLogoUrl) {
          const oldLogoPath = currentLogoUrl.split('/store-logos/').pop();
          if (oldLogoPath) {
            await supabase.storage.from('store-logos').remove([oldLogoPath]);
          }
        }

        // Upload new logo
        const fileExtension = logoFile.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const filePath = `${store.id}/${fileName}`; // Store logos per store ID

        const { error: uploadError } = await supabase.storage
          .from('store-logos') // TODO: Ensure this bucket exists in Supabase Storage
          .upload(filePath, logoFile, {
            upsert: true // Overwrite if file with same path exists (e.g., if re-uploading the same file name)
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from('store-logos')
          .getPublicUrl(filePath);
        
        newLogoUrl = publicUrlData.publicUrl;
      }

      // 2. Update Store Details in Database
      const { error: updateError } = await supabase
        .from('stores')
        .update({
          name: name.trim(),
          whatsapp_number: whatsappNumber.trim(),
          logo_url: newLogoUrl,
        })
        .eq('id', store.id);

      if (updateError) {
        throw updateError;
      }

      // 3. Success: Refresh and Close
      onStoreUpdated();
      onClose();

    } catch (err: any) {
      console.error('Error updating store:', err);
      setError(err.message || 'Ocurrió un error al actualizar la tienda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Editar Tienda</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 text-left">Nombre de la Tienda</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
          </div>
          <div className="mb-4">
            <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700 text-left">Número de WhatsApp</label>
            <input id="whatsappNumber" type="text" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
          </div>
          <div className="mb-6">
            <label htmlFor="logo" className="block text-sm font-medium text-gray-700 text-left">Logo de la Tienda</label>
            {currentLogoUrl && !logoFile && (
              <div className="mt-2 mb-4">
                <img src={currentLogoUrl} alt="Current Logo" className="h-20 w-20 object-cover rounded-full mx-auto" />
                <p className="text-center text-sm text-gray-500">Logo actual</p>
              </div>
            )}
            <input id="logo" type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files ? e.target.files[0] : null)} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            {!currentLogoUrl && !logoFile && <p className="text-sm text-gray-500 mt-1">Sube un logo para tu tienda.</p>}
          </div>
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

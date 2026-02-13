// src/components/EditProductForm.tsx
import React, { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import type { Product } from '../types';

interface EditProductFormProps {
  product: Product;
  plan_type: string;
  onClose: () => void;
  onProductUpdated: () => void;
}

const EditProductForm: React.FC<EditProductFormProps> = ({ product, plan_type, onClose, onProductUpdated }) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isDiscountActive, setIsDiscountActive] = useState(false);
  const [discountTimerSeconds, setDiscountTimerSeconds] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setTitle(product.title);
      setPrice(product.price.toString());
      setExternalLink(product.external_link || '');
      setVideoLink(product.video_link || '');
      setHashtags(product.hashtags ? product.hashtags.join(', ') : '');

      const hasDiscount = !!product.discount_percentage && !!product.discount_timer_seconds;
      setIsDiscountActive(hasDiscount);
      setDiscountTimerSeconds(hasDiscount ? String(product.discount_timer_seconds) : '');
      setDiscountPercentage(hasDiscount ? String(product.discount_percentage) : '');
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !price) {
      setError('El nombre y el precio son obligatorios.');
      return;
    }

    setIsSubmitting(true);

    try {
      const hashtagsArray = hashtags.split(',').map(h => h.trim()).filter(h => h);

      const updatePayload: Partial<Product> = {
        title,
        price: parseFloat(price),
        external_link: externalLink || null,
        video_link: videoLink || null,
        hashtags: hashtagsArray.length > 0 ? hashtagsArray : null,
      };

      if (plan_type === 'full') {
        if (isDiscountActive) {
          updatePayload.discount_timer_seconds = discountTimerSeconds ? parseInt(discountTimerSeconds, 10) : null;
          updatePayload.discount_percentage = discountPercentage ? parseInt(discountPercentage, 10) : null;
        } else {
          updatePayload.discount_timer_seconds = null;
          updatePayload.discount_percentage = null;
        }
      }

      const { error: updateError } = await getSupabase()
        .from('products')
        .update(updatePayload)
        .eq('id', product.id);

      if (updateError) {
        throw updateError;
      }

      onProductUpdated();
      onClose();

    } catch (error: unknown) {
      console.error('Error updating product:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ocurrió un error al actualizar el producto.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Editar Producto</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 text-left">Nombre del Producto</label>
            <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
          </div>
          <div className="mb-4">
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 text-left">Precio (USD)</label>
            <input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
          </div>
          
          <div className="mb-4">
            <label htmlFor="externalLink" className="block text-sm font-medium text-gray-700 text-left">Enlace Externo (Tienda)</label>
            <input id="externalLink" type="url" value={externalLink} onChange={(e) => setExternalLink(e.target.value)} placeholder="https://ejemplo.com/producto" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div className="mb-6">
            <label htmlFor="videoLink" className="block text-sm font-medium text-gray-700 text-left">Enlace de Video (YouTube, etc.)</label>
            <input id="videoLink" type="url" value={videoLink} onChange={(e) => setVideoLink(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
          </div>

          {plan_type === 'full' && (
            <>
              <div className="mb-6">
                <label htmlFor="hashtags" className="block text-sm font-medium text-gray-700 text-left">Hashtags (separados por coma)</label>
                <input id="hashtags" type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#verano, #oferta, #nuevo" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center">
                  <input id="discountToggle" type="checkbox" checked={isDiscountActive} onChange={() => setIsDiscountActive(!isDiscountActive)} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                  <label htmlFor="discountToggle" className="ml-2 block text-sm font-medium text-gray-700">Activar oferta por inactividad</label>
                </div>
                {isDiscountActive && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="discountTimer" className="block text-xs font-medium text-gray-700">Espera (segundos)</label>
                      <input id="discountTimer" type="number" value={discountTimerSeconds} onChange={(e) => setDiscountTimerSeconds(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                      <label htmlFor="discountPercentage" className="block text-xs font-medium text-gray-700">Descuento (%)</label>
                      <input id="discountPercentage" type="number" value={discountPercentage} onChange={(e) => setDiscountPercentage(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="flex items-center justify-end space-x-4 mt-6">
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

export default EditProductForm;
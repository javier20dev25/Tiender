// src/components/AddProductForm.tsx
import { useState } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid'; // Para generar nombres de archivo únicos
import type { Product } from '../types';

interface AddProductFormProps {
  storeId: string;
  plan_type: string;
  onClose: () => void;
  onProductAdded: () => void;
}

const AddProductForm: React.FC<AddProductFormProps> = ({ storeId, plan_type, onClose, onProductAdded }) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [externalLink, setExternalLink] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isDiscountActive, setIsDiscountActive] = useState(false);
  const [discountTimerSeconds, setDiscountTimerSeconds] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [isWholesaleActive, setIsWholesaleActive] = useState(false);
  const [wholesaleThreshold, setWholesaleThreshold] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !price || !imageFile) {
      setError('Nombre, precio e imagen son obligatorios.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Subir la imagen a Supabase Storage
      const fileExtension = imageFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `${storeId}/${fileName}`;

      const { error: uploadError } = await getSupabase().storage
        .from('product-images')
        .upload(filePath, imageFile);

      if (uploadError) {
        throw uploadError;
      }

      // 2. Construir la URL pública manualmente
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const imageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${filePath}`;

      // 3. Insertar el producto en la base de datos
      const hashtagsArray = hashtags.split(',').map(h => h.trim()).filter(h => h);
      
      const insertPayload: Partial<Product> = {
        store_id: storeId,
        title,
        price: parseFloat(price),
        image_url: imageUrl,
        external_link: externalLink || null,
        video_link: videoLink || null,
        hashtags: hashtagsArray.length > 0 ? hashtagsArray : null,
      };

      if (plan_type === 'full') {
        if (isDiscountActive) {
          insertPayload.discount_timer_seconds = discountTimerSeconds ? parseInt(discountTimerSeconds, 10) : null;
          insertPayload.discount_percentage = discountPercentage ? parseInt(discountPercentage, 10) : null;
        }
        if (isWholesaleActive) {
          insertPayload.wholesale_threshold = wholesaleThreshold ? parseInt(wholesaleThreshold, 10) : null;
          insertPayload.wholesale_price = wholesalePrice ? parseFloat(wholesalePrice) : null;
        }
      }

      const { error: insertError } = await getSupabase()
        .from('products')
        .insert(insertPayload);

      if (insertError) {
        throw insertError;
      }

      // 4. Éxito: refrescar y cerrar
      onProductAdded();
      onClose();

    } catch (error: unknown) {
      console.error('Error adding product:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ocurrió un error al añadir el producto.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Añadir Nuevo Producto</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 text-left">Nombre del Producto</label>
            <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
          </div>
          <div className="mb-4">
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 text-left">Precio (USD)</label>
            <input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
          </div>
          <div className="mb-6">
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 text-left">Imagen del Producto</label>
            <input id="image" type="file" accept="image/*" onChange={(e) => e.target.files && setImageFile(e.target.files[0])} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" required />
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

              {/* Wholesale Section */}
              <div className="border-t border-gray-200 pt-6 mt-4">
                <div className="flex items-center">
                  <input id="wholesaleToggle" type="checkbox" checked={isWholesaleActive} onChange={() => setIsWholesaleActive(!isWholesaleActive)} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                  <label htmlFor="wholesaleToggle" className="ml-2 block text-sm font-medium text-gray-700">Activar precios al por mayor</label>
                </div>
                {isWholesaleActive && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="wholesaleThreshold" className="block text-xs font-medium text-gray-700">Cantidad Mínima</label>
                      <input id="wholesaleThreshold" type="number" value={wholesaleThreshold} onChange={(e) => setWholesaleThreshold(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                      <label htmlFor="wholesalePrice" className="block text-xs font-medium text-gray-700">Precio por Unidad</label>
                      <input id="wholesalePrice" type="number" step="0.01" value={wholesalePrice} onChange={(e) => setWholesalePrice(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
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
              {isSubmitting ? 'Añadiendo...' : 'Añadir Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductForm;
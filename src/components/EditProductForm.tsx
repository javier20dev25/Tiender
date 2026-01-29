// src/components/EditProductForm.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Product {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
}

interface EditProductFormProps {
  product: Product;
  onClose: () => void;
  onProductUpdated: () => void;
}

const EditProductForm: React.FC<EditProductFormProps> = ({ product, onClose, onProductUpdated }) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setTitle(product.title);
      setPrice(product.price.toString());
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
      // Por ahora, solo actualizamos los datos de texto/precio.
      // La actualización de la imagen se puede añadir en el futuro.
      const { error: updateError } = await supabase
        .from('products')
        .update({
          title,
          price: parseFloat(price),
        })
        .eq('id', product.id);

      if (updateError) {
        throw updateError;
      }

      // Éxito: refrescar y cerrar
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
          {/* Campo de imagen deshabilitado por ahora para simplicidad */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-500 text-left">Imagen del Producto</label>
            <p className="text-sm text-gray-600 mt-1">La edición de imágenes no está disponible en esta versión.</p>
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

export default EditProductForm;

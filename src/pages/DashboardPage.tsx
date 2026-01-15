// src/pages/DashboardPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import AddProductForm from '../components/AddProductForm';
import EditProductForm from '../components/EditProductForm';
import EditStoreForm from '../components/EditStoreForm';

type Store = {
  id: string;
  name: string;
  logo_url: string | null;
  whatsapp_number: string;
  plan: string;
  product_limit: number;
};

type Product = {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
};

const DashboardPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateStoreForm, setShowCreateStoreForm] = useState(false);
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditStoreForm, setShowEditStoreForm] = useState(false);
  
  const [newStoreName, setNewStoreName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    setEditingProduct(null);
    setShowAddProductForm(false);
    setShowEditStoreForm(false);

    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id, name, logo_url, whatsapp_number, plan, product_limit') // Obtener plan y límite
      .eq('user_id', user.id)
      .single();

    if (storeError && storeError.code !== 'PGRST116') {
      setError('No se pudo cargar la información de tu tienda.');
      setLoading(false);
      return;
    }
    setStore(storeData);

    if (storeData) {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, title, price, image_url')
        .eq('store_id', storeData.id)
        .order('created_at', { ascending: false });

      if (productsError) {
        setError('No se pudieron cargar los productos.');
      } else {
        setProducts(productsData || []);
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchDashboardData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, fetchDashboardData]);

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim() || !user || !user.phone) return;
    setIsSubmitting(true);
    setError('');
    const { error: insertError } = await supabase.from('stores').insert({
      name: newStoreName.trim(),
      user_id: user.id,
      whatsapp_number: user.phone || 'N/A',
      // product_limit tendrá el valor DEFAULT 10 de la DB
    });
    if (insertError) {
      setError('Hubo un error al crear tu tienda. Inténtalo de nuevo.');
    } else {
      await fetchDashboardData();
    }
    setIsSubmitting(false);
  };

  const handleDeleteProduct = async (productId: string, imageUrl: string | null) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
    setIsSubmitting(true);
    setError('');
    try {
      const { error: dbError } = await supabase.from('products').delete().eq('id', productId);
      if (dbError) throw dbError;
      if (imageUrl) {
        const imagePath = imageUrl.split('/product-images/').pop();
        if (imagePath) {
          await supabase.storage.from('product-images').remove([imagePath]);
        }
      }
      await fetchDashboardData();
    } catch (err: any) {
      setError('No se pudo eliminar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderContent = () => {
    if (loading || authLoading) return <p>Cargando panel...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    if (store) {
      const atProductLimit = products.length >= store.product_limit;

      return (
        <div className="w-full text-left">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              {store.logo_url && <img src={store.logo_url} alt="Store Logo" className="h-12 w-12 object-cover rounded-full" />}
              <div>
                <h2 className="text-2xl font-bold">Tu Tienda: {store.name}</h2>
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold capitalize px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">{store.plan}</span>
                    <button className="text-sm text-blue-600 hover:underline">Mejorar Plan</button>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowEditStoreForm(true)}
                className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 disabled:bg-gray-400"
                disabled={isSubmitting}
              >
                Editar Tienda
              </button>
              <button 
                onClick={() => setShowAddProductForm(true)}
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400"
                disabled={isSubmitting || atProductLimit}
              >
                + Añadir Producto
              </button>
            </div>
          </div>
          
          {atProductLimit && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md" role="alert">
              <p className="font-bold">Límite de productos alcanzado</p>
              <p>Has alcanzado el límite de {store.product_limit} productos para tu plan actual. ¡Mejora tu plan para añadir más!</p>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="text-xl font-semibold mb-4">Tus Productos ({products.length}/{store.product_limit})</h3>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <div key={product.id} className="bg-gray-50 rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
                    <img src={product.image_url || 'https://placehold.co/600x400'} alt={product.title} className="w-full h-40 object-cover" />
                    <div className="p-4">
                      <h4 className="font-bold text-lg truncate">{product.title}</h4>
                      <p className="text-gray-700 text-md mb-3">${product.price.toFixed(2)}</p>
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => setEditingProduct(product)} className="text-sm px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:bg-gray-300" disabled={isSubmitting}>Editar</button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id, product.image_url)}
                          className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:bg-gray-300"
                          disabled={isSubmitting}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <p>Aún no tienes productos. ¡Añade el primero!</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (showCreateStoreForm) {
      return (
        <form onSubmit={handleCreateStore} className="w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-4">Dale un nombre a tu tienda</h2>
          <input type="text" value={newStoreName} onChange={(e) => setNewStoreName(e.target.value)} placeholder="Ej: Tienda de Ana" className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg" required />
          <button type="submit" disabled={isSubmitting} className="w-full px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md disabled:bg-gray-400">
            {isSubmitting ? 'Creando...' : 'Crear Tienda'}
          </button>
        </form>
      );
    }

    return (
      <div>
        <h2 className="text-2xl font-bold mb-2">¡Bienvenido!</h2>
        <p className="mb-4">Parece que aún no tienes una tienda. ¡Créala ahora!</p>
        <button onClick={() => setShowCreateStoreForm(true)} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
          Crea tu Tienda Social
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="p-8 bg-white rounded-lg shadow-lg text-center w-full max-w-4xl">
          <h1 className="text-3xl font-bold mb-6">Panel del Vendedor</h1>
          {renderContent()}
        </div>
      </div>
      {showAddProductForm && store && (
        <AddProductForm 
          storeId={store.id}
          onClose={() => setShowAddProductForm(false)}
          onProductAdded={fetchDashboardData}
        />
      )}
      {editingProduct && (
        <EditProductForm
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onProductUpdated={fetchDashboardData}
        />
      )}
      {showEditStoreForm && store && (
        <EditStoreForm
          store={store}
          onClose={() => setShowEditStoreForm(false)}
          onStoreUpdated={fetchDashboardData}
        />
      )}
    </>
  );
};

export default DashboardPage;



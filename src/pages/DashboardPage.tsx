// src/pages/DashboardPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import AddProductForm from '../components/AddProductForm'; // Importar el nuevo componente

type Store = {
  id: string;
  name: string;
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
  const [newStoreName, setNewStoreName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('user_id', user.id)
      .single();

    if (storeError && storeError.code !== 'PGRST116') {
      console.error('Error fetching store:', storeError);
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
        console.error('Error fetching products:', productsError);
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
    setIsCreating(true);
    setError('');
    const { error: insertError } = await supabase.from('stores').insert({
      name: newStoreName.trim(),
      user_id: user.id,
      whatsapp_number: user.phone,
    });
    if (insertError) {
      setError('Hubo un error al crear tu tienda. Inténtalo de nuevo.');
    } else {
      setShowCreateStoreForm(false);
      setNewStoreName('');
      await fetchDashboardData();
    }
    setIsCreating(false);
  };
  
  const renderContent = () => {
    if (loading || authLoading) return <p>Cargando panel...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    if (store) {
      return (
        <div className="w-full text-left">
          <h2 className="text-2xl font-bold mb-4">Tu Tienda: {store.name}</h2>
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Productos</h3>
            {products.length > 0 ? (
              <ul>
                {products.map(p => <li key={p.id}>{p.title} - ${p.price}</li>)}
              </ul>
            ) : (
              <p>Aún no tienes productos. ¡Añade el primero!</p>
            )}
            <button 
              onClick={() => setShowAddProductForm(true)}
              className="mt-4 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700"
            >
              Añadir Producto
            </button>
          </div>
        </div>
      );
    }

    if (showCreateStoreForm) {
      return (
        <form onSubmit={handleCreateStore} className="w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-4">Dale un nombre a tu tienda</h2>
          <input type="text" value={newStoreName} onChange={(e) => setNewStoreName(e.target.value)} placeholder="Ej: Tienda de Ana" className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg" required />
          <button type="submit" disabled={isCreating} className="w-full px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md disabled:bg-gray-400">
            {isCreating ? 'Creando...' : 'Crear Tienda'}
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
        <div className="p-8 bg-white rounded-lg shadow-lg text-center w-full max-w-lg">
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
    </>
  );
};

export default DashboardPage;


// src/pages/DashboardPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import AddProductForm from '../components/AddProductForm';
import EditProductForm from '../components/EditProductForm';
import EditStoreForm from '../components/EditStoreForm';
import AnalyticsSummary, { type AnalyticsData } from '../components/AnalyticsSummary';
import MobileMenu from '../components/MobileMenu';
import CancellationModal from '../components/CancellationModal';

type Store = {
  id: string;
  name: string;
  logo_url: string | null;
  whatsapp_number: string;
  plan_type: string;
  product_limit: number;
};

type Product = {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
};

const DashboardPage: React.FC = () => {
  // Triggering redeployment to apply new environment variables.
  const { user, loading: authLoading } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for forms and UI
  const [showCreateStoreForm, setShowCreateStoreForm] = useState(false);
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditStoreForm, setShowEditStoreForm] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Estado para el menú
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false); // Estado para el modal de cancelación

  // State for Analytics
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);


  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    setEditingProduct(null);
    setShowAddProductForm(false);
    setShowEditStoreForm(false);

    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id, name, logo_url, whatsapp_number, plan_type, product_limit')
      .eq('user_id', user.id)
      .single();

    if (storeError && storeError.code !== 'PGRST116') {
      console.error('Error fetching store data:', storeError); // Log the detailed error
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

  const fetchAnalytics = useCallback(async (storeId: string) => {
    setLoadingAnalytics(true);
    setAnalyticsError(null);
    try {
      const { data, error } = await supabase
        .rpc('get_store_analytics', { target_store_id: storeId });

      if (error) {
        console.error('Error fetching analytics:', error);
        throw new Error('No se pudo cargar la analítica.');
      }
      setAnalyticsData(data);
    } catch (error: unknown) {
        console.error('Error fetching analytics:', error);
        setAnalyticsError((error as Error).message);
      } finally {
        setLoadingAnalytics(false);
      }
    }, []);

  useEffect(() => {
    if (!authLoading && user) {
      fetchDashboardData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, fetchDashboardData]);

  useEffect(() => {
    if (store?.id) {
      fetchAnalytics(store.id);
    }
  }, [store, fetchAnalytics]);

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim() || !user || !user.phone) return;
    setIsSubmitting(true);
    setError('');
    const { error: insertError } = await supabase.from('stores').insert({
      name: newStoreName.trim(),
      user_id: user.id,
      whatsapp_number: user.phone || 'N/A',
      // product_limit will use the DEFAULT 10 from the DB
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
      // Refresh both product list and analytics
      await Promise.all([fetchDashboardData(), store ? fetchAnalytics(store.id) : Promise.resolve()]);
    } catch (error: unknown) {
      console.error("Error deleting product:", error);
      setError('No se pudo eliminar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpgrade = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const { data, error } = await supabase.functions.invoke('create-paypal-subscription');
      if (error) throw error;
      
      if (data.approve_url) {
        window.location.href = data.approve_url;
      } else {
        throw new Error('No se recibió la URL de aprobación de PayPal.');
      }
    } catch (error: unknown) {
      console.error('Error invoking subscription function:', error);
      setError('No se pudo iniciar el proceso de mejora de plan. Inténtalo de nuevo.');
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!store) return;
    const url = `${window.location.origin}/tienda/${store.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleShare = async () => {
    if (!store || !analyticsData?.top_products) {
      alert("No hay suficientes datos de analítica para compartir.");
      return;
    }
    
    setIsSharing(true);
    setError('');

    try {
      // Step 1: Ensure the share image is generated and up-to-date
      await supabase.functions.invoke('generate-share-image', {
        body: { storeId: store.id },
      });

      // Step 2: Construct the URL using the production domain from environment variables
      const appUrl = import.meta.env.VITE_APP_URL || 'https://tiender.vercel.app'; // Force production URL
      const shareUrl = `${appUrl}/s/${store.id}`;

      // Step 3: Use the Web Share API
      if (navigator.share) {
        await navigator.share({
          title: `¡Mira el Top 5 de ${store.name}!`,
          text: `Estos son los productos más populares de nuestra tienda. ¡Échales un vistazo!`,
          url: shareUrl,
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        navigator.clipboard.writeText(shareUrl);
        alert('El enlace para compartir se ha copiado a tu portapapeles. ¡Pégalo en tus redes sociales!');
      }
    } catch (error: unknown) {
      console.error("Share failed:", error);
      setError("No se pudo generar el enlace para compartir. Inténtalo de nuevo.");
    } finally {
      setIsSharing(false);
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
                    <span className="text-sm font-semibold capitalize px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">{store.plan_type}</span>
                    <button onClick={handleUpgrade} disabled={isSubmitting} className="text-sm text-blue-600 hover:underline disabled:text-gray-500">
                      {isSubmitting ? 'Procesando...' : 'Mejorar Plan'}
                    </button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center space-x-2">
               <Link to={`/tienda/${store.id}`} target="_blank" className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700">
                Ver Tienda
              </Link>
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600"
              >
                {copied ? '¡Copiado!' : 'Copiar Enlace'}
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400"
                disabled={isSubmitting || isSharing || !analyticsData?.top_products?.length}
              >
                {isSharing ? 'Generando...' : 'Compartir Top 5'}
              </button>
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
          
          <AnalyticsSummary
            data={analyticsData}
            loading={loadingAnalytics}
            error={analyticsError}
            onRefresh={() => {
              if (store?.id) {
                fetchAnalytics(store.id);
              }
            }}
          />

          {atProductLimit && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md" role="alert">
              <p className="font-bold">Límite de productos alcanzado</p>
              <p>Has alcanzado el límite de {store.product_limit} productos para tu plan actual. ¡Mejora tu plan para añadir más!</p>
            </div>
          )}

          <div className="border-t pt-4 mt-8">
            <h3 className="text-xl font-semibold mb-4">Tus Productos ({products.length}/{store.product_limit})</h3>
            {products.length > 0 ? (
              <div className="space-y-4">
                {products.map(product => (
                  <div key={product.id} className="flex items-center bg-gray-50 p-4 rounded-lg shadow-md space-x-4">
                    <img src={product.image_url || 'https://placehold.co/100x100'} alt={product.title} className="w-20 h-20 object-cover rounded-md" />
                    <div className="flex-grow">
                      <h4 className="font-bold text-lg">{product.title}</h4>
                      <p className="text-gray-700 text-md">${product.price.toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <button onClick={() => setEditingProduct(product)} className="text-sm px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-300" disabled={isSubmitting}>Editar</button>
                      <button
                        onClick={() => handleDeleteProduct(product.id, product.image_url)}
                        className="text-sm px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:bg-gray-300"
                        disabled={isSubmitting}
                      >
                        Eliminar
                      </button>
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Panel del Vendedor</h1>
            <button 
              onClick={() => setIsMenuOpen(true)} 
              className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
              aria-label="Abrir menú"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-4 6h4" />
              </svg>
            </button>
          </div>
          {renderContent()}
        </div>
      </div>
      {showAddProductForm && store && (
        <AddProductForm 
          storeId={store.id}
          onClose={() => setShowAddProductForm(false)}
          onProductAdded={async () => {
            await fetchDashboardData();
            if (store) await fetchAnalytics(store.id);
          }}
        />
      )}
      {editingProduct && (
        <EditProductForm
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onProductUpdated={async () => {
            await fetchDashboardData();
            if (store) await fetchAnalytics(store.id);
          }}
        />
      )}
      {showEditStoreForm && store && (
        <EditStoreForm
          store={store}
          onClose={() => setShowEditStoreForm(false)}
          onStoreUpdated={async () => {
            await fetchDashboardData();
            if (store) await fetchAnalytics(store.id);
          }}
        />
      )}
      <MobileMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        onOpenCancelModal={() => setIsCancelModalOpen(true)}
      />
      <CancellationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onSuccess={() => {
          setIsCancelModalOpen(false);
          alert('Tu suscripción ha sido programada para cancelación al final del período.');
          fetchDashboardData(); // Re-fetch data para reflejar cualquier cambio de estado inmediato
        }}
      />
    </>
  );
};

export default DashboardPage;
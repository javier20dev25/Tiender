// src/pages/DashboardPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Now the source of truth for store and subscription
import { getSupabase } from '../lib/supabaseClient';
import type { Product } from '../types';
import AddProductForm from '../components/AddProductForm';
import EditProductForm from '../components/EditProductForm';
import EditStoreForm from '../components/EditStoreForm';
import { WeeklyAnalytics } from '../components/WeeklyAnalytics';
import MobileMenu from '../components/MobileMenu';
import CancellationModal from '../components/CancellationModal';
import ReportModal from '../components/ReportModal';
import SubscriptionStatusBanner from '../components/SubscriptionStatusBanner'; // Import the new banner

// The DashboardStore type might need adjustment based on what 'store' from context provides
// For now, let's assume the context's store is sufficient.

type WeeklyAnalyticsData = {
  heatmap_data: any[];
  product_summary: any[];
  total_summary: { total_visits: number; total_adds_to_cart: number; };
};

const DashboardPage: React.FC = () => {
  const { user, store, subscription, loading: authLoading } = useAuth(); // Using full context
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // State for forms and UI
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditStoreForm, setShowEditStoreForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // State for Analytics
  const [weeklyAnalyticsData, setWeeklyAnalyticsData] = useState<WeeklyAnalyticsData | null>(null);
  const [loadingWeeklyAnalytics, setLoadingWeeklyAnalytics] = useState(true);
  const [weeklyAnalyticsError, setWeeklyAnalyticsError] = useState<string | null>(null);
  const [endDate, setEndDate] = useState(new Date());
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return date;
  });

  // State for AI Report
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (storeId: string) => {
    setLoadingProducts(true);
    const { data: productsData, error: productsError } = await getSupabase()
      .from('products')
      .select('id, title, price, description, image_url, store_id, created_at, external_link, video_link')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (productsError) {
      setError('No se pudieron cargar los productos.');
    } else {
      setProducts(productsData || []);
    }
    setLoadingProducts(false);
  }, []);

  const fetchWeeklyAnalytics = useCallback(async (storeId: string, start: Date, end: Date) => {
    setLoadingWeeklyAnalytics(true);
    setWeeklyAnalyticsError(null);
    try {
      const { data, error: rpcError } = await getSupabase()
        .rpc('get_weekly_heatmap_analytics', { 
          target_store_id: storeId,
          start_date: start.toISOString(),
          end_date: end.toISOString()
        });
  
      if (rpcError) throw new Error('No se pudo cargar la analítica semanal.');
      setWeeklyAnalyticsData(data);
    } catch (err: unknown) {
        setWeeklyAnalyticsError((err as Error).message);
      } finally {
        setLoadingWeeklyAnalytics(false);
      }
  }, []);

  // Fetch products and analytics whenever the store from context changes
  useEffect(() => {
    if (store?.id) {
      fetchProducts(store.id);
      if (startDate <= endDate) {
        fetchWeeklyAnalytics(store.id, startDate, endDate);
      }
    }
  }, [store, startDate, endDate, fetchProducts, fetchWeeklyAnalytics]);
  
  // Simplified handlers from here...
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    setReport(null);
    setReportError(null);
    try {
      const { data, error } = await getSupabase().functions.invoke('generate-store-report');
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setReport(data.report);
    } catch (err: unknown) {
      setReportError('Hubo un error al generar el informe.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDeleteProduct = async (productId: string, imageUrl: string | null) => {
    if (!window.confirm('¿Estás seguro?')) return;
    setIsSubmitting(true);
    setError('');
    try {
      const { error: dbError } = await getSupabase().from('products').delete().eq('id', productId);
      if (dbError) throw dbError;
      if (imageUrl) {
        const imagePath = imageUrl.split('/product-images/').pop();
        if (imagePath) await getSupabase().storage.from('product-images').remove([imagePath]);
      }
      if (store) {
        await Promise.all([fetchProducts(store.id), fetchWeeklyAnalytics(store.id, startDate, endDate)]);
      }
    } catch (error: unknown) {
      setError('No se pudo eliminar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpgrade = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const { data, error } = await getSupabase().functions.invoke('create-paypal-subscription', {
        body: { planType: 'full' },
      });
      if (error) throw error;
      if (data.approve_url) window.location.href = data.approve_url;
      else throw new Error('No se recibió la URL de aprobación de PayPal.');
    } catch (error: unknown) {
      setError('No se pudo iniciar la mejora de plan.');
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
    if (!store) return;
    setIsSharing(true);
    setError('');
    try {
      await getSupabase().functions.invoke('generate-share-image', { body: { storeId: store.id } });
      const appUrl = import.meta.env.VITE_APP_URL || 'https://tiender.vercel.app';
      const shareUrl = `${appUrl}/s/${store.id}`;
      if (navigator.share) {
        await navigator.share({ title: `¡Mira los productos de ${store.name}!`, text: `Estos son los productos de nuestra tienda.`, url: shareUrl });
      } else {
        navigator.clipboard.writeText(shareUrl);
        alert('Enlace para compartir copiado.');
      }
    } catch (error: unknown) {
      setError("No se pudo generar el enlace para compartir.");
    } finally {
      setIsSharing(false);
    }
  };
  
  const renderContent = () => {
    if (authLoading) return <p>Cargando panel...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    // The store now comes from AuthContext
    if (store) {
      const product_limit = (store as any).product_limit || 10; // Assuming product_limit might be on store
      const atProductLimit = products.length >= product_limit;

      return (
        <div className="w-full text-left">
          {/* BANNER INJECTION POINT */}
          <SubscriptionStatusBanner subscription={subscription} />

          <div className="flex items-start justify-between mb-6">
            {/* Header remains mostly the same, using store from context */}
            <div className="flex items-center space-x-4">
              {(store as any).logo_url && <img src={(store as any).logo_url} alt="Store Logo" className="h-12 w-12 object-cover rounded-full" />}
              <div>
                <h2 className="text-2xl font-bold">Tu Tienda: {store.name}</h2>
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold capitalize px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">{store.plan_type}</span>
                    {store.plan_type !== 'full' && (
                      <button onClick={handleUpgrade} disabled={isSubmitting} className="text-sm text-blue-600 hover:underline disabled:text-gray-500">
                        {isSubmitting ? 'Procesando...' : 'Mejorar Plan'}
                      </button>
                    )}
                </div>
              </div>
            </div>
            {/* Action buttons... */}
            <div className="flex flex-wrap items-center space-x-2">
               <Link to={`/tienda/${store.id}`} target="_blank" className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700">Ver Tienda</Link>
              <button onClick={handleCopyLink} className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600">{copied ? '¡Copiado!' : 'Copiar Enlace'}</button>
              <button onClick={handleShare} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400" disabled={isSubmitting || isSharing}>{isSharing ? 'Generando...' : 'Compartir Tienda'}</button>
              <button onClick={() => setShowEditStoreForm(true)} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 disabled:bg-gray-400" disabled={isSubmitting}>Editar Tienda</button>
              <button onClick={() => setShowAddProductForm(true)} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400" disabled={isSubmitting || atProductLimit}>+ Añadir Producto</button>
            </div>
          </div>
          
          {/* Analytics and Product sections remain, but loading state might need adjustment */}
          <div className="my-6 p-4 bg-gray-100 rounded-lg text-gray-800">
            {/* Date range picker... */}
          </div>
          {/* ... Rest of the JSX for analytics, products etc. ... */}
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
                      <button onClick={() => handleDeleteProduct(product.id, product.image_url || null)} className="text-sm px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:bg-gray-300" disabled={isSubmitting}>Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
               <div className="text-center py-10 bg-gray-50 rounded-lg"><p>Aún no tienes productos.</p></div>
            )}
        </div>
      );
    }

    // Fallback for user without a store
    return (
      <div>
        <h2 className="text-2xl font-bold mb-2">¡Bienvenido!</h2>
        <p className="mb-4">Para empezar a vender, necesitas una tienda.</p>
        <button onClick={() => alert("La creación de tienda desde aquí debe ser implementada.")} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
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
            <button onClick={() => setIsMenuOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400" aria-label="Abrir menú">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-4 6h4" /></svg>
            </button>
          </div>
          {renderContent()}
        </div>
      </div>
      {showAddProductForm && store && <AddProductForm storeId={store.id} plan_type={store.plan_type} onClose={() => setShowAddProductForm(false)} onProductAdded={() => store && fetchProducts(store.id)} />}
      {editingProduct && store && <EditProductForm product={editingProduct} plan_type={store.plan_type} onClose={() => setEditingProduct(null)} onProductUpdated={() => store && fetchProducts(store.id)} />}
      {showEditStoreForm && store && (store as any).whatsapp_number && <EditStoreForm store={store as any} onClose={() => setShowEditStoreForm(false)} onStoreUpdated={() => { /* Consider refreshing context here */ }} />}
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onOpenCancelModal={() => setIsCancelModalOpen(true)} />
      <CancellationModal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} onSuccess={() => { setIsCancelModalOpen(false); alert('Suscripción programada para cancelación.'); }} />
      {report && <ReportModal report={report} onClose={() => setReport(null)} />}
    </>
  );
};

export default DashboardPage;

// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, AlertTriangle, Menu, Sparkles, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSupabase } from '../lib/supabaseClient';
import type { Product } from '../types';
import AddProductForm from '../components/AddProductForm';
import EditProductForm from '../components/EditProductForm';
import EditStoreForm from '../components/EditStoreForm';
import MobileMenu from '../components/MobileMenu';
import CancellationModal from '../components/CancellationModal';
import SubscriptionStatusBanner from '../components/SubscriptionStatusBanner';
import TrialBanner from '../components/TrialBanner';
import CreateStoreForm from '../components/CreateStoreForm';
import { PasswordChangeModal } from '../components/PasswordChangeModal';
import { WeeklyAnalytics } from '../components/WeeklyAnalytics';
import { DashboardSkeleton } from '../components/Skeleton';
import { Perf } from '../utils/perf';

// Custom Hooks & Sub-components
import { useProducts } from '../hooks/useProducts';
import { useWeeklyAnalytics } from '../hooks/useWeeklyAnalytics';
import { StoreHeader } from '../components/dashboard/StoreHeader';
import { StatsGrid } from '../components/dashboard/StatsGrid';
import { ProductList } from '../components/dashboard/ProductList';
import { TopProductsSection, type TopProductItem } from '../components/dashboard/TopProductsSection';
import { CustomerInsights } from '../components/dashboard/CustomerInsights';
import { ShareTopModal } from '../components/dashboard/ShareTopModal';

const DashboardPage: React.FC = () => {
  const { user, store, subscription, loading: authLoading } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    // Only show password modal once per session, and only if still flagged
    const sessionKey = `pwd_modal_shown_${user?.id}`;
    if (user?.user_metadata?.must_change_password && !sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      setIsPasswordModalOpen(true);
    }
  }, [user]);

  // Custom Hooks
  const { products, loadingProducts, fetchProducts } = useProducts(store?.id);
  const { weeklyAnalyticsData, loadingWeeklyAnalytics, startDate } = useWeeklyAnalytics(store?.id);

  // Top Products (from v1 get_store_analytics RPC)
  const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);
  const [loadingTopProducts, setLoadingTopProducts] = useState(false);

  useEffect(() => {
    if (!store?.id) {
      setTopProducts([]);
      return;
    }
    let cancelled = false;
    setLoadingTopProducts(true);
    (async () => {
      try {
        const { data, error: rpcError } = await getSupabase().rpc('get_store_analytics', {
          target_store_id: store.id,
        });
        if (!cancelled && !rpcError && data?.top_products) {
          setTopProducts(data.top_products as TopProductItem[]);
        }
      } catch {
        // silent fallback
      } finally {
        if (!cancelled) setLoadingTopProducts(false);
      }
    })();
    return () => { cancelled = true; };
  }, [store?.id]);

  // Perf tracking
  useEffect(() => {
    if (authLoading) {
      Perf.start('Dashboard_Load');
    } else {
      Perf.end('Dashboard_Load');
    }
  }, [authLoading]);

  // UI State
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditStoreForm, setShowEditStoreForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [showCreateStoreForm, setShowCreateStoreForm] = useState(false);
  const [showShareTopModal, setShowShareTopModal] = useState(false);

  const handleDeleteProduct = async (productId: string, imageUrl: string | null) => {
    if (!window.confirm('¿Quieres eliminar este producto?')) return;
    setIsSubmitting(true);
    try {
      const { error: dbError } = await getSupabase().from('products').delete().eq('id', productId);
      if (dbError) throw dbError;
      if (imageUrl) {
        const imagePath = imageUrl.split('/product-images/').pop();
        if (imagePath) await getSupabase().storage.from('product-images').remove([imagePath]);
      }
      if (store) fetchProducts(store.id);
    } catch {
      setError('No se pudo eliminar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpgrade = async () => {
    if (!store) return;
    
    // Si ya está en el plan Full, no hacer nada.
    if (store.plan_type === 'full') {
      alert('Ya tienes activo el plan FULL para tu prueba gratuita.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const isTrialActive = store.trial_ends_at ? new Date(store.trial_ends_at) > new Date() : false;
      const hasActivePayPalSubscription = subscription?.status === 'active' || subscription?.status === 'trialing';

      if (isTrialActive && !hasActivePayPalSubscription) {
        const { error: updateError } = await getSupabase()
          .from('stores')
          .update({ plan_type: 'full' })
          .eq('id', store.id);

        if (updateError) throw updateError;
        
        alert('¡Plan FULL activado para tu prueba gratuita!');
        window.location.reload();
        return;
      }

      const { data, error } = await getSupabase().functions.invoke('create-paypal-subscription', {
        body: { planType: 'full' },
      });
      if (error) throw error;
      
      if (data?.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else if (data?.approve_url) {
        window.location.href = data.approve_url;
      } else {
        throw new Error('No se recibió una URL de aprobación de PayPal.');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error?.message || 'Error al iniciar la mejora de plan.');
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (authLoading) return <DashboardSkeleton />;

    if (store) {
      const productLimit = store.product_limit || 10;
      const atProductLimit = products.length >= productLimit;

      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full text-left space-y-8">
          <TrialBanner />
          <SubscriptionStatusBanner subscription={subscription} />

          {/* Business Header */}
          <StoreHeader 
            store={store} 
            onEditClick={() => setShowEditStoreForm(true)}
            onUpgradeClick={handleUpgrade}
            onShareClick={() => setShowShareTopModal(true)}
            isSubmittingUpgrade={isSubmitting}
          />

          {/* Stats Grid */}
          <StatsGrid 
            analyticsData={weeklyAnalyticsData}
            productsCount={products.length}
            productLimit={productLimit}
          />

          {/* Ranking Top y Análisis de Clientes (A la par del Top) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <TopProductsSection
              topProducts={topProducts}
              loading={loadingTopProducts}
              onShareTopClick={() => setShowShareTopModal(true)}
            />
            <CustomerInsights
              topProducts={topProducts}
              analyticsData={weeklyAnalyticsData}
              productsCount={products.length}
              loading={loadingTopProducts || loadingWeeklyAnalytics}
            />
          </div>

          {/* Catálogo de Productos y Actividad Reciente */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Products Section */}
            <ProductList 
              products={products}
              loadingProducts={loadingProducts}
              atProductLimit={atProductLimit}
              onAddClick={() => setShowAddProductForm(true)}
              onEditClick={(p) => setEditingProduct(p)}
              onDeleteClick={handleDeleteProduct}
            />

            {/* Actividad Reciente Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">Actividad Reciente</h3>
                  <p className="text-xs text-slate-500">Flujo semanal y conversiones</p>
                </div>
              </div>
              <div className="p-6 rounded-[28px] bg-white border border-slate-200/80 shadow-sm">
                <WeeklyAnalytics
                  heatmapData={weeklyAnalyticsData?.heatmap_data || []}
                  productSummary={weeklyAnalyticsData?.product_summary || []}
                  totalSummary={weeklyAnalyticsData?.total_summary || { total_visits: 0, total_adds_to_cart: 0 }}
                  isLoading={loadingWeeklyAnalytics}
                  startDate={startDate}
                />
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-20 text-center">
        <div className="p-6 bg-violet-50 text-violet-600 rounded-full mb-6 border border-violet-100 shadow-sm">
          <Sparkles className="w-12 h-12" />
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight italic uppercase">Tiender Pro</h2>
        <p className="text-slate-500 max-w-sm mb-8 font-medium text-base leading-relaxed">
          Estás a un paso de revolucionar tus ventas de WhatsApp. ¡Crea tu tienda ahora!
        </p>
        <button
          onClick={() => setShowCreateStoreForm(true)}
          className="sunset-button px-9 py-4 rounded-2xl text-lg flex items-center gap-3 shadow-lg shadow-violet-500/20"
        >
          <Plus className="w-6 h-6" />
          <span>Lanzar mi Tienda</span>
        </button>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-violet-200 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Discreet Top Bar with Menu */}
        <div className="flex justify-between items-center py-5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sunset-gradient flex items-center justify-center font-black italic text-brand-dark text-xs shadow-sm">
              T
            </div>
            <span className="font-black text-slate-900 tracking-tight italic uppercase text-base">Tiender</span>
            <h1 className="sr-only">Centro de Mando</h1>
          </div>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all"
            title="Menú"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <p className="font-bold text-sm">{error}</p>
          </div>
        )}

        {renderContent()}
      </div>

      <AnimatePresence>
        {showAddProductForm && store && (
          <AddProductForm
            storeId={store.id}
            plan_type={store.plan_type}
            onClose={() => setShowAddProductForm(false)}
            onProductAdded={() => fetchProducts(store.id)}
          />
        )}
        {editingProduct && store && (
          <EditProductForm
            product={editingProduct}
            plan_type={store.plan_type}
            onClose={() => setEditingProduct(null)}
            onProductUpdated={() => fetchProducts(store.id)}
          />
        )}
        {showEditStoreForm && store && (
          <EditStoreForm
            store={store}
            onClose={() => setShowEditStoreForm(false)}
            onStoreUpdated={() => window.location.reload()}
          />
        )}
        {showShareTopModal && store && (
          <ShareTopModal
            store={store}
            onClose={() => setShowShareTopModal(false)}
          />
        )}
      </AnimatePresence>

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenCancelModal={() => setIsCancelModalOpen(true)}
      />
      <CancellationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onSuccess={() => { setIsCancelModalOpen(false); alert('Suscripción cancelada.'); }}
      />
      {showCreateStoreForm && <CreateStoreForm onClose={() => setShowCreateStoreForm(false)} />}
      <PasswordChangeModal isOpen={isPasswordModalOpen} onSuccess={() => setIsPasswordModalOpen(false)} />
    </div>
  );
};

export default DashboardPage;

// src/pages/DashboardPage.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Plus, AlertTriangle, Menu, Sparkles, BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSupabase } from '../lib/supabaseClient';
import type { Product } from '../types';
import AddProductForm from '../components/AddProductForm';
import EditProductForm from '../components/EditProductForm';
import EditStoreForm from '../components/EditStoreForm';
import MobileMenu from '../components/MobileMenu';
import CancellationModal from '../components/CancellationModal';
import ReportModal from '../components/ReportModal';
import SubscriptionStatusBanner from '../components/SubscriptionStatusBanner';
import TrialBanner from '../components/TrialBanner';
import CreateStoreForm from '../components/CreateStoreForm';
import { WeeklyAnalytics } from '../components/WeeklyAnalytics';

// Custom Hooks & Sub-components
import { useProducts } from '../hooks/useProducts';
import { useWeeklyAnalytics } from '../hooks/useWeeklyAnalytics';
import { StoreHeader } from '../components/dashboard/StoreHeader';
import { StatsGrid } from '../components/dashboard/StatsGrid';
import { ProductList } from '../components/dashboard/ProductList';

const DashboardPage: React.FC = () => {
  const { store, subscription, loading: authLoading } = useAuth();
  
  // Custom Hooks
  const { products, loadingProducts, fetchProducts } = useProducts(store?.id);
  const { weeklyAnalyticsData, loadingWeeklyAnalytics, startDate } = useWeeklyAnalytics(store?.id);

  // UI State
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditStoreForm, setShowEditStoreForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [showCreateStoreForm, setShowCreateStoreForm] = useState(false);

  // AI Report State
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const { data, error } = await getSupabase().functions.invoke('generate-store-report');
      if (error || data.error) throw new Error(error?.message || data.error);
      setReport(data.report);
    } catch {
      setError('No se pudo generar el reporte IA.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

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
    setIsSubmitting(true);
    try {
      const { data, error } = await getSupabase().functions.invoke('create-paypal-subscription', {
        body: { planType: 'full' },
      });
      if (error) throw error;
      if (data.approve_url) window.location.href = data.approve_url;
    } catch {
      setError('Error al iniciar la mejora de plan.');
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (authLoading) return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-brand-neon border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-500 font-medium">Cargando tu centro de mando...</p>
      </div>
    );

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
            isSubmittingUpgrade={isSubmitting}
          />

          {/* Stats Grid */}
          <StatsGrid 
            analyticsData={weeklyAnalyticsData}
            productsCount={products.length}
            productLimit={productLimit}
            isGeneratingReport={isGeneratingReport}
            onGenerateReport={handleGenerateReport}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Products Section */}
            <ProductList 
              products={products}
              loadingProducts={loadingProducts}
              atProductLimit={atProductLimit}
              onAddClick={() => setShowAddProductForm(true)}
              onEditClick={(p) => setEditingProduct(p)}
              onDeleteClick={handleDeleteProduct}
            />

            {/* Analytics Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-brand-cyan" />
                Actividad Reciente
              </h3>
              <div className="p-6 rounded-[30px] bg-zinc-900 border border-white/5">
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
        <div className="p-6 bg-brand-neon/10 text-brand-neon rounded-full mb-8"><Sparkles className="w-12 h-12" /></div>
        <h2 className="text-4xl font-black text-white mb-4 tracking-tighter italic uppercase">Tiender Pro</h2>
        <p className="text-zinc-500 max-w-sm mb-10 font-medium text-lg leading-relaxed">Estás a un paso de revolucionar tus ventas de WhatsApp. ¡Crea tu tienda ahora!</p>
        <button onClick={() => setShowCreateStoreForm(true)} className="sunset-button px-10 py-5 rounded-[25px] text-xl flex items-center gap-3">
          <Plus className="w-7 h-7" />
          <span>Lanzar mi Tienda</span>
        </button>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white selection:bg-brand-neon/30 pb-12">
      <div className="max-w-6xl mx-auto px-6 pt-10">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-neon rounded-xl"><LayoutDashboard className="w-6 h-6 text-brand-dark" /></div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">Centro de Mando</h1>
          </div>
          <button onClick={() => setIsMenuOpen(true)} className="p-3 bg-zinc-900 border border-white/5 rounded-2xl hover:bg-zinc-800 transition-all group">
            <Menu className="w-6 h-6 text-zinc-400 group-hover:text-white" />
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <p className="font-bold text-sm tracking-tight">{error}</p>
          </div>
        )}

        {renderContent()}
      </div>

      <AnimatePresence>
        {showAddProductForm && store && <AddProductForm storeId={store.id} plan_type={store.plan_type} onClose={() => setShowAddProductForm(false)} onProductAdded={() => fetchProducts(store.id)} />}
        {editingProduct && store && <EditProductForm product={editingProduct} plan_type={store.plan_type} onClose={() => setEditingProduct(null)} onProductUpdated={() => fetchProducts(store.id)} />}
        {showEditStoreForm && store && <EditStoreForm store={store} onClose={() => setShowEditStoreForm(false)} onStoreUpdated={() => window.location.reload()} />}
      </AnimatePresence>

      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onOpenCancelModal={() => setIsCancelModalOpen(true)} />
      <CancellationModal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} onSuccess={() => { setIsCancelModalOpen(false); alert('Suscripción cancelada.'); }} />
      {report && <ReportModal report={report} onClose={() => setReport(null)} />}
      {showCreateStoreForm && <CreateStoreForm onClose={() => setShowCreateStoreForm(false)} onStoreCreated={() => window.location.reload()} />}
    </div>
  );
};

export default DashboardPage;

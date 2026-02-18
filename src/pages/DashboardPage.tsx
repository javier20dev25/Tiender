// src/pages/DashboardPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Plus, Share2, Eye, Copy,
  ExternalLink, BarChart3, AlertTriangle, PackageOpen,
  Trash2, Edit3, Menu, Sparkles, ShoppingCart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSupabase } from '../lib/supabaseClient';
import type { Product } from '../types';
import AddProductForm from '../components/AddProductForm';
import EditProductForm from '../components/EditProductForm';
import EditStoreForm from '../components/EditStoreForm';
import { WeeklyAnalytics } from '../components/WeeklyAnalytics';
import MobileMenu from '../components/MobileMenu';
import CancellationModal from '../components/CancellationModal';
import ReportModal from '../components/ReportModal';
import SubscriptionStatusBanner from '../components/SubscriptionStatusBanner';
import TrialBanner from '../components/TrialBanner';
import CreateStoreForm from '../components/CreateStoreForm';

import type { WeeklyAnalyticsData } from '../types';

const DashboardPage: React.FC = () => {
  const { store, subscription, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // UI State
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditStoreForm, setShowEditStoreForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [showCreateStoreForm, setShowCreateStoreForm] = useState(false);

  // Analytics State
  const [weeklyAnalyticsData, setWeeklyAnalyticsData] = useState<WeeklyAnalyticsData | null>(null);
  const [loadingWeeklyAnalytics, setLoadingWeeklyAnalytics] = useState(true);
  const [endDate] = useState(new Date());
  const [startDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return date;
  });

  // AI Report State
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const fetchProducts = useCallback(async (storeId: string) => {
    setLoadingProducts(true);
    const { data: productsData, error: productsError } = await getSupabase()
      .from('products')
      .select('id, title, price, description, image_url, store_id, created_at, external_link, video_link')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (!productsError) setProducts(productsData || []);
    setLoadingProducts(false);
  }, []);

  const fetchWeeklyAnalytics = useCallback(async (storeId: string, start: Date, end: Date) => {
    setLoadingWeeklyAnalytics(true);
    try {
      const { data, error } = await getSupabase().rpc('get_weekly_heatmap_analytics', {
        target_store_id: storeId,
        start_date: start.toISOString(),
        end_date: end.toISOString()
      });
      if (error) throw error;
      setWeeklyAnalyticsData(data);
    } catch (err: unknown) {
      console.error((err as Error).message);
    } finally {
      setLoadingWeeklyAnalytics(false);
    }
  }, []);

  useEffect(() => {
    if (store?.id) {
      fetchProducts(store.id);
      fetchWeeklyAnalytics(store.id, startDate, endDate);
    }
  }, [store, startDate, endDate, fetchProducts, fetchWeeklyAnalytics]);

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

  const handleCopyLink = () => {
    if (!store) return;
    navigator.clipboard.writeText(`${window.location.origin}/tienda/${store.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!store) return;
    setIsSharing(true);
    try {
      await getSupabase().functions.invoke('generate-share-image', { body: { storeId: store.id } });
      const shareUrl = `${window.location.origin}/s/${store.id}`;
      if (navigator.share) {
        await navigator.share({ title: `Visita ${store.name}`, text: `Mira mis productos en Tiender`, url: shareUrl });
      } else {
        navigator.clipboard.writeText(shareUrl);
        alert('Enlace copiado.');
      }
    } catch {
      setError("Error al compartir.");
    } finally {
      setIsSharing(false);
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-[30px] bg-zinc-900 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-neon/5 blur-[100px] -z-10"></div>
            <div className="flex items-center space-x-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-sunset-gradient opacity-0 group-hover:opacity-20 blur-md transition-opacity rounded-full"></div>
                {store.logo_url ? (
                  <img src={store.logo_url} alt="" className="h-16 w-16 object-cover rounded-full border-2 border-white/10 ring-4 ring-black shadow-2xl" />
                ) : (
                  <div className="h-16 w-16 bg-zinc-800 rounded-full flex items-center justify-center border-2 border-white/10 ring-4 ring-black shadow-2xl">
                    <PackageOpen className="w-8 h-8 text-zinc-600" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white tracking-tight">{store.name}</h2>
                  <button
                    onClick={() => setShowEditStoreForm(true)}
                    className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-brand-neon hover:bg-zinc-700 transition-all group"
                    title="Editar perfil de la tienda"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-zinc-800 text-brand-cyan rounded-full border border-brand-cyan/20">Plan {store.plan_type}</span>
                  {store.plan_type !== 'full' && (
                    <button onClick={handleUpgrade} disabled={isSubmitting} className="text-xs font-bold text-brand-pink hover:text-white transition-colors flex items-center gap-1 group">
                      <Sparkles className="w-3 h-3 group-hover:animate-spin" />
                      Mejorar Plan
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link to={`/tienda/${store.id}`} target="_blank" className="px-5 py-2.5 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-all flex items-center gap-2 border border-white/5">
                <ExternalLink className="w-4 h-4" />
                <span>Ver Tienda</span>
              </Link>
              <button onClick={handleCopyLink} className="px-5 py-2.5 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-all flex items-center gap-2 border border-white/5">
                <Copy className="w-4 h-4" />
                <span>{copied ? '¡Copiado!' : 'Enlace'}</span>
              </button>
              <button onClick={handleShare} disabled={isSharing} className="px-5 py-2.5 bg-brand-cyan text-brand-dark font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                <span>{isSharing ? '...' : 'Compartir'}</span>
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-[30px] bg-zinc-900 border border-white/5 flex flex-col justify-between h-40 group hover:border-brand-neon/30 transition-all cursor-default">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-brand-neon/10 rounded-2xl text-brand-neon group-hover:scale-110 transition-transform"><Eye className="w-5 h-5" /></div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Hoy</div>
              </div>
              <div>
                <div className="text-4xl font-black text-white">{weeklyAnalyticsData?.total_summary.total_visits || 0}</div>
                <div className="text-xs font-medium text-zinc-500 mt-1">Visitas en la tienda</div>
              </div>
            </div>
            <div className="p-6 rounded-[30px] bg-zinc-900 border border-white/5 flex flex-col justify-between h-40 group hover:border-brand-pink/30 transition-all cursor-default">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-brand-pink/10 rounded-2xl text-brand-pink group-hover:scale-110 transition-transform"><ShoppingCart className="w-5 h-5" /></div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Hoy</div>
              </div>
              <div>
                <div className="text-4xl font-black text-white">{weeklyAnalyticsData?.total_summary.total_adds_to_cart || 0}</div>
                <div className="text-xs font-medium text-zinc-500 mt-1">Interés de compra</div>
              </div>
            </div>
            <div className="p-6 rounded-[30px] bg-zinc-900 border border-white/5 flex flex-col justify-between h-40 group hover:border-brand-cyan/30 transition-all cursor-default">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-brand-cyan/10 rounded-2xl text-brand-cyan group-hover:scale-110 transition-transform"><LayoutDashboard className="w-5 h-5" /></div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Almacén</div>
              </div>
              <div>
                <div className="text-4xl font-black text-white">{products.length} / {productLimit}</div>
                <div className="text-xs font-medium text-zinc-500 mt-1">Productos activos</div>
              </div>
            </div>
            <div className="p-6 rounded-[30px] bg-zinc-900 border border-white/5 flex flex-col justify-between h-40 group hover:border-brand-yellow/30 transition-all cursor-pointer" onClick={handleGenerateReport}>
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-brand-yellow/10 rounded-2xl text-brand-yellow group-hover:scale-110 transition-transform"><Sparkles className="w-5 h-5" /></div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Asistente</div>
              </div>
              <div>
                <div className="text-lg font-black text-white leading-tight">{isGeneratingReport ? 'Analizando...' : 'Generar Informe IA'}</div>
                <div className="text-xs font-medium text-zinc-500 mt-1">Estrategia de ventas</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Products Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <PackageOpen className="w-5 h-5 text-brand-neon" />
                  Catálogo de Productos
                </h3>
                <button onClick={() => setShowAddProductForm(true)} aria-label="Añadir Producto" disabled={atProductLimit} className="p-2.5 rounded-2xl bg-brand-neon/10 text-brand-neon hover:bg-brand-neon hover:text-brand-dark transition-all disabled:opacity-30">
                  <Plus className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {loadingProducts ? (
                  <p className="text-zinc-600 text-center py-10">Cargando catálogo...</p>
                ) : products.length > 0 ? (
                  products.map(product => (
                    <div key={product.id} className="flex items-center gap-4 p-4 rounded-3xl bg-zinc-900 border border-white/5 group hover:border-white/20 transition-all">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-xl border border-white/5">
                        <img src={product.image_url || 'https://placehold.co/100x100'} alt={product.title} title={product.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-bold text-white truncate">{product.title}</h4>
                        <p className="text-brand-neon font-black">${product.price.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingProduct(product)} aria-label="Editar" className="p-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"><Edit3 className="w-5 h-5" /></button>
                        <button onClick={() => handleDeleteProduct(product.id, product.image_url || null)} aria-label="Eliminar" className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-zinc-800 border-dashed">
                    <div className="p-4 bg-zinc-800/50 rounded-full w-fit mx-auto mb-4"><Plus className="w-8 h-8 text-zinc-600" /></div>
                    <p className="text-zinc-500 font-medium">No tienes productos aún.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Analytics Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-brand-cyan" />
                Actividad Reciente
              </h3>
              <div className="p-6 rounded-[30px] bg-zinc-900 border border-white/5">
                {store && (
                  <WeeklyAnalytics
                    heatmapData={weeklyAnalyticsData?.heatmap_data || []}
                    productSummary={weeklyAnalyticsData?.product_summary || []}
                    totalSummary={weeklyAnalyticsData?.total_summary || { total_visits: 0, total_adds_to_cart: 0 }}
                    isLoading={loadingWeeklyAnalytics}
                    startDate={startDate}
                  />
                )}
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
        {showEditStoreForm && store && <EditStoreForm store={store} onClose={() => setShowEditStoreForm(false)} onStoreUpdated={() => { }} />}
      </AnimatePresence>

      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onOpenCancelModal={() => setIsCancelModalOpen(true)} />
      <CancellationModal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} onSuccess={() => { setIsCancelModalOpen(false); alert('Suscripción cancelada.'); }} />
      {report && <ReportModal report={report} onClose={() => setReport(null)} />}
      {showCreateStoreForm && <CreateStoreForm onClose={() => setShowCreateStoreForm(false)} onStoreCreated={() => window.location.reload()} />}
    </div>
  );
};

export default DashboardPage;

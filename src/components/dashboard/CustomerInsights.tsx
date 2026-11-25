import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Sparkles, Heart, ShoppingBag, Lightbulb, Users } from 'lucide-react';
import type { TopProductItem } from './TopProductsSection';
import type { WeeklyAnalyticsData } from '../../types';

interface CustomerInsightsProps {
  topProducts: TopProductItem[];
  analyticsData: WeeklyAnalyticsData | null;
  productsCount: number;
  loading?: boolean;
}

export const CustomerInsights: React.FC<CustomerInsightsProps> = ({
  topProducts,
  analyticsData,
  productsCount,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="p-6 rounded-[28px] bg-white border border-slate-200/80 shadow-sm flex flex-col items-center justify-center min-h-[320px]">
        <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-slate-500">Calculando análisis de clientes...</p>
      </div>
    );
  }

  const starProduct = topProducts.length > 0 ? topProducts[0] : null;
  const totalLikes = topProducts.reduce((acc, p) => acc + (p.likes || 0), 0);
  const totalDislikes = topProducts.reduce((acc, p) => acc + (p.dislikes || 0), 0);
  const totalReactions = totalLikes + totalDislikes;
  const affinityRate = totalReactions > 0 ? Math.round((totalLikes / totalReactions) * 100) : null;

  const totalVisits = analyticsData?.total_summary?.total_visits || 0;
  const totalAdds = analyticsData?.total_summary?.total_adds_to_cart || 0;
  const conversionRate = totalVisits > 0 ? ((totalAdds / totalVisits) * 100).toFixed(1) : '0.0';

  const hasActivity = totalVisits > 0 || totalAdds > 0 || topProducts.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-[28px] bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-violet-50 text-violet-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Análisis de Clientes</h3>
              <p className="text-xs text-slate-500">Tendencias e interés en tus productos</p>
            </div>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            En Tiempo Real
          </span>
        </div>

        {hasActivity ? (
          <div className="space-y-3.5 mt-4">
            {/* Producto Estrella */}
            {starProduct && (
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-700 flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="text-xs leading-relaxed text-slate-700">
                  <span className="font-bold text-slate-900">Producto Estrella: </span>
                  <span className="font-semibold text-amber-900">"{starProduct.title}"</span> es el favorito de tus clientes, acumulando{' '}
                  <span className="font-bold text-slate-900">{starProduct.likes} likes</span> y{' '}
                  <span className="font-bold text-slate-900">{starProduct.added_to_cart} añadidos</span> al carrito.
                </div>
              </div>
            )}

            {/* Nivel de Aprobación */}
            {affinityRate !== null ? (
              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/60 flex items-start gap-3">
                <div className="p-2 bg-rose-100 rounded-xl text-rose-600 flex-shrink-0 mt-0.5">
                  <Heart className="w-4 h-4" />
                </div>
                <div className="text-xs leading-relaxed text-slate-700">
                  <span className="font-bold text-slate-900">Afinidad con tu Catálogo: </span>
                  El <span className="font-bold text-rose-600">{affinityRate}%</span> de las reacciones de tus clientes son positivas (Likes), mostrando gran interés visual por tus artículos.
                </div>
              </div>
            ) : null}

            {/* Conversión e Intención */}
            <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/60 flex items-start gap-3">
              <div className="p-2 bg-sky-100 rounded-xl text-sky-600 flex-shrink-0 mt-0.5">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="text-xs leading-relaxed text-slate-700">
                <span className="font-bold text-slate-900">Intención de Compra: </span>
                Con una tasa de conversión del <span className="font-bold text-sky-700">{conversionRate}%</span>, tus visitantes están explorando activamente para armar sus pedidos por WhatsApp.
              </div>
            </div>

            {/* Recomendación práctica */}
            <div className="p-3.5 rounded-2xl bg-violet-50/70 border border-violet-200/60 flex items-start gap-3">
              <div className="p-2 bg-violet-100 rounded-xl text-violet-700 flex-shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="text-xs leading-relaxed text-slate-700">
                <span className="font-bold text-slate-900">Consejo para Vender Más: </span>
                Comparte la tarjeta visual del <span className="font-semibold text-violet-800">Top Productos</span> en tus historias de WhatsApp e Instagram para transformar el interés en ventas inmediatas.
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 px-4 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-700 max-w-sm mx-auto">
              Aún no hay interacciones registradas.
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
              Comparte el enlace de tu tienda con tus clientes. Aquí verás qué productos prefieren, su nivel de satisfacción y recomendaciones personalizadas.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Catálogo evaluado: <strong>{productsCount} productos</strong></span>
        <span>Visitas registradas: <strong>{totalVisits}</strong></span>
      </div>
    </motion.div>
  );
};

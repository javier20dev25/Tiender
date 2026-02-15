// src/components/WeeklyAnalytics.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Eye, ShoppingCart, TrendingUp, Calendar, Info, Package } from 'lucide-react';
import { AnalyticsHeatmap } from './AnalyticsHeatmap';

type HeatmapData = {
  hour: string;
  visits: number;
  adds_to_cart: number;
};

type ProductSummary = {
  id: string;
  title: string;
  image_url: string | null;
  total_added_to_cart: number;
};

type TotalSummary = {
  total_visits: number;
  total_adds_to_cart: number;
};

type WeeklyAnalyticsProps = {
  heatmapData: HeatmapData[];
  productSummary: ProductSummary[];
  totalSummary: TotalSummary;
  isLoading: boolean;
  startDate: Date;
};

export const WeeklyAnalytics: React.FC<WeeklyAnalyticsProps> = ({
  heatmapData,
  productSummary,
  totalSummary,
  isLoading,
  startDate,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin mb-3"></div>
        <p className="text-zinc-500 text-sm font-medium">Sincronizando datos...</p>
      </div>
    );
  }

  const conversionRate = totalSummary.total_visits > 0
    ? ((totalSummary.total_adds_to_cart / totalSummary.total_visits) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-10">
      {/* Mini Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-800/50 border border-white/5">
          <div className="flex items-center gap-2 mb-1 text-zinc-500">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Conversión</span>
          </div>
          <div className="text-2xl font-black text-brand-neon">{conversionRate}%</div>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-800/50 border border-white/5">
          <div className="flex items-center gap-2 mb-1 text-zinc-500">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Ciclo</span>
          </div>
          <div className="text-lg font-bold text-white leading-none mt-1">7 Días</div>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <Info className="w-3.5 h-3.5" />
            Flujo Horario
          </h4>
          <div className="flex items-center gap-3 text-[10px] font-medium text-zinc-500">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-brand-pink/40"></div> Visitas</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-brand-cyan border border-brand-cyan"></div> Carrito</div>
          </div>
        </div>
        <div className="rounded-[25px] bg-brand-dark/50 overflow-hidden">
          <AnalyticsHeatmap data={heatmapData} startDate={startDate} />
        </div>
      </div>

      {/* Top Products Table (Simplified for Sidebar/Dashboard vibe) */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
          <Package className="w-3.5 h-3.5" />
          Rendimiento por Producto
        </h4>
        <div className="space-y-2">
          {productSummary.length > 0 ? (
            productSummary.map((product, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={product.id}
                className="flex items-center gap-3 p-2 rounded-2xl bg-zinc-800/30 border border-white/5"
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                  <img src={product.image_url || 'https://placehold.co/50x50'} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-xs font-bold text-white truncate">{product.title}</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-pink/10 text-brand-pink border border-brand-pink/10">
                  <ShoppingCart className="w-3 h-3" />
                  <span className="text-[10px] font-black">{product.total_added_to_cart}</span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-6 text-[10px] font-medium text-zinc-600 italic">No hay datos de productos aún.</div>
          )}
        </div>
      </div>
    </div>
  );
};

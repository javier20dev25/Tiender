// src/components/WeeklyAnalytics.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, TrendingUp, Calendar, Info, Package } from 'lucide-react';
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
        <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-3"></div>
        <p className="text-slate-500 text-sm font-medium">Sincronizando datos...</p>
      </div>
    );
  }

  const conversionRate = totalSummary.total_visits > 0
    ? ((totalSummary.total_adds_to_cart / totalSummary.total_visits) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-8">
      {/* Mini Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
          <div className="flex items-center gap-2 mb-1 text-slate-500">
            <TrendingUp className="w-3.5 h-3.5 text-violet-600" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Conversión</span>
          </div>
          <div className="text-2xl font-black text-violet-700">{conversionRate}%</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
          <div className="flex items-center gap-2 mb-1 text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Ciclo</span>
          </div>
          <div className="text-lg font-bold text-slate-800 leading-none mt-1">7 Días</div>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            Flujo Horario
          </h4>
          <div className="flex items-center gap-3 text-[10px] font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-rose-400"></div>
              <span>Visitas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-sky-50 border-2 border-sky-500"></div>
              <span>Carrito</span>
            </div>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden border border-slate-200/70">
          <AnalyticsHeatmap data={heatmapData} startDate={startDate} />
        </div>
      </div>

      {/* Top Products Table */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-slate-500" />
          Rendimiento por Producto
        </h4>
        <div className="space-y-2">
          {productSummary.length > 0 ? (
            productSummary.map((product, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                key={product.id}
                className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/70 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm flex-shrink-0 bg-slate-100 border border-slate-200">
                  <img src={product.image_url || 'https://placehold.co/50x50'} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{product.title}</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200/60">
                  <ShoppingCart className="w-3 h-3" />
                  <span className="text-[10px] font-black">{product.total_added_to_cart}</span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-6 text-xs font-medium text-slate-400 italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              No hay datos de productos aún.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

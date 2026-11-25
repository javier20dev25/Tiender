import React from 'react';
import { motion } from 'framer-motion';
import { Eye, ShoppingCart, LayoutDashboard, TrendingUp } from 'lucide-react';
import type { WeeklyAnalyticsData } from '../../types';

interface StatsGridProps {
  analyticsData: WeeklyAnalyticsData | null;
  productsCount: number;
  productLimit: number;
  isGeneratingReport?: boolean;
  onGenerateReport?: () => void;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  analyticsData,
  productsCount,
  productLimit,
}) => {
  const totalVisits = analyticsData?.total_summary?.total_visits || 0;
  const totalAdds = analyticsData?.total_summary?.total_adds_to_cart || 0;
  const conversionRate = totalVisits > 0 ? ((totalAdds / totalVisits) * 100).toFixed(1) : '0.0';

  const cards = [
    {
      title: 'Visitas en la tienda',
      value: totalVisits,
      subtitle: 'Tráfico de la semana',
      tag: 'Semana',
      icon: Eye,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/50',
      hoverBorder: 'hover:border-emerald-300',
    },
    {
      title: 'Interés de compra',
      value: totalAdds,
      subtitle: 'Añadidos al carrito',
      tag: 'Semana',
      icon: ShoppingCart,
      iconBg: 'bg-rose-50 text-rose-500 border border-rose-200/50',
      hoverBorder: 'hover:border-rose-300',
    },
    {
      title: 'Productos activos',
      value: `${productsCount} / ${productLimit}`,
      subtitle: 'Capacidad de catálogo',
      tag: 'Almacén',
      icon: LayoutDashboard,
      iconBg: 'bg-sky-50 text-sky-600 border border-sky-200/50',
      hoverBorder: 'hover:border-sky-300',
    },
    {
      title: 'Tasa de Conversión',
      value: `${conversionRate}%`,
      subtitle: 'Interés vs visitas',
      tag: 'Rendimiento',
      icon: TrendingUp,
      iconBg: 'bg-violet-50 text-violet-600 border border-violet-200/50',
      hoverBorder: 'hover:border-violet-300',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.06 }}
            whileHover={{ y: -4, scale: 1.015, transition: { duration: 0.15 } }}
            className={`p-6 rounded-[26px] bg-white border border-slate-200/80 shadow-sm ${card.hoverBorder} flex flex-col justify-between h-40 transition-all cursor-default select-none`}
          >
            <div className="flex justify-between items-start">
              <div className={`p-2.5 rounded-2xl ${card.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-full">
                {card.tag}
              </span>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 tracking-tight">{card.value}</div>
              <div className="text-xs font-semibold text-slate-500 mt-1 flex items-center justify-between">
                <span>{card.title}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

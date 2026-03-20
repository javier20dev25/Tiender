import React from 'react';
import { Eye, ShoppingCart, LayoutDashboard, Sparkles } from 'lucide-react';
import type { WeeklyAnalyticsData } from '../../types';

interface StatsGridProps {
  analyticsData: WeeklyAnalyticsData | null;
  productsCount: number;
  productLimit: number;
  isGeneratingReport: boolean;
  onGenerateReport: () => void;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ analyticsData, productsCount, productLimit, isGeneratingReport, onGenerateReport }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-6 rounded-[30px] bg-zinc-900 border border-white/5 flex flex-col justify-between h-40 group hover:border-brand-neon/30 transition-all cursor-default">
        <div className="flex justify-between items-start">
          <div className="p-2.5 bg-brand-neon/10 rounded-2xl text-brand-neon group-hover:scale-110 transition-transform"><Eye className="w-5 h-5" /></div>
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Semana</div>
        </div>
        <div>
          <div className="text-4xl font-black text-white">{analyticsData?.total_summary.total_visits || 0}</div>
          <div className="text-xs font-medium text-zinc-500 mt-1">Visitas en la tienda</div>
        </div>
      </div>
      <div className="p-6 rounded-[30px] bg-zinc-900 border border-white/5 flex flex-col justify-between h-40 group hover:border-brand-pink/30 transition-all cursor-default">
        <div className="flex justify-between items-start">
          <div className="p-2.5 bg-brand-pink/10 rounded-2xl text-brand-pink group-hover:scale-110 transition-transform"><ShoppingCart className="w-5 h-5" /></div>
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Semana</div>
        </div>
        <div>
          <div className="text-4xl font-black text-white">{analyticsData?.total_summary.total_adds_to_cart || 0}</div>
          <div className="text-xs font-medium text-zinc-500 mt-1">Interés de compra</div>
        </div>
      </div>
      <div className="p-6 rounded-[30px] bg-zinc-900 border border-white/5 flex flex-col justify-between h-40 group hover:border-brand-cyan/30 transition-all cursor-default">
        <div className="flex justify-between items-start">
          <div className="p-2.5 bg-brand-cyan/10 rounded-2xl text-brand-cyan group-hover:scale-110 transition-transform"><LayoutDashboard className="w-5 h-5" /></div>
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Almacén</div>
        </div>
        <div>
          <div className="text-4xl font-black text-white">{productsCount} / {productLimit}</div>
          <div className="text-xs font-medium text-zinc-500 mt-1">Productos activos</div>
        </div>
      </div>
      <div className="p-6 rounded-[30px] bg-zinc-900 border border-white/5 flex flex-col justify-between h-40 group hover:border-brand-yellow/30 transition-all cursor-pointer" onClick={onGenerateReport}>
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
  );
};

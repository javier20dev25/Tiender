
import React from 'react';
import { AnalyticsHeatmap } from './AnalyticsHeatmap';
import { AnalyticsLegend } from './AnalyticsLegend';
import { AnalyticsProductTable } from './AnalyticsProductTable';

// Placeholder types, will be refined with types from src/types.ts
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
        <div className="text-center p-8 bg-gray-900 text-white rounded-xl">
            Cargando analíticas...
        </div>
    );
  }

  const conversionRate = totalSummary.total_visits > 0 
    ? ((totalSummary.total_adds_to_cart / totalSummary.total_visits) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="p-4 bg-gray-900 text-white rounded-xl">
      <h2 className="text-2xl font-bold mb-4">Análisis Semanal</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-500/20 p-4 rounded-lg">
          <p className="text-sm text-blue-200">Visitas Totales</p>
          <p className="text-3xl font-bold">{totalSummary.total_visits}</p>
        </div>
        <div className="bg-purple-500/20 p-4 rounded-lg">
          <p className="text-sm text-purple-200">Añadidos al Carrito</p>
          <p className="text-3xl font-bold">{totalSummary.total_adds_to_cart}</p>
        </div>
        <div className="bg-green-500/20 p-4 rounded-lg">
          <p className="text-sm text-green-200">Tasa de Conversión</p>
          <p className="text-3xl font-bold">{conversionRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <AnalyticsHeatmap data={heatmapData} startDate={startDate} />
        </div>
        <div>
          <AnalyticsLegend />
        </div>
      </div>
      
      <AnalyticsProductTable data={productSummary} />

    </div>
  );
};

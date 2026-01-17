// src/components/AnalyticsSummary.tsx
import React from 'react';

// --- Types ---

type TopProduct = {
  id: string;
  title: string;
  image_url: string | null;
  likes: number;
  dislikes: number;
  added_to_cart: number;
  score: number;
};

export type AnalyticsData = {
  total_visits: number;
  top_products: TopProduct[] | null;
};

interface AnalyticsSummaryProps {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
}

// --- Component ---

const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({ data, loading, error }) => {
  if (loading) {
    return (
      <div className="mt-8 p-6 bg-white rounded-lg shadow-md animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="mt-8 p-6 bg-red-50 text-red-700 rounded-lg shadow-md">Error al cargar la analítica: {error}</div>;
  }

  if (!data) {
    return null; // Or a message indicating no data is available
  }

  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Resumen de Analítica</h2>

      {/* Total Visits */}
      <div className="mb-8">
        <p className="text-lg text-gray-600">Visitas Totales a tu Tienda</p>
        <p className="text-5xl font-bold text-blue-600">{data.total_visits}</p>
      </div>

      {/* Top Products */}
      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Top 5 Productos</h3>
        {data.top_products && data.top_products.length > 0 ? (
          <ul className="space-y-4">
            {data.top_products.map((product, index) => (
              <li key={product.id} className="flex items-center p-3 bg-gray-50 rounded-lg shadow-sm">
                <span className="text-2xl font-bold text-gray-400 w-8">{index + 1}</span>
                <img
                  src={product.image_url || 'https://placehold.co/100x100'}
                  alt={product.title}
                  className="w-16 h-16 object-cover rounded-md mx-4"
                />
                <div className="flex-grow">
                  <p className="font-bold text-gray-800">{product.title}</p>
                  <div className="flex space-x-4 text-sm text-gray-500 mt-1">
                    <span>❤️ {product.likes}</span>
                    <span>❌ {product.dislikes}</span>
                    <span>🛒 {product.added_to_cart}</span>
                  </div>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg text-blue-500">{product.score}</p>
                    <p className="text-xs text-gray-400">Puntaje</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center py-8">No hay suficientes datos de productos para mostrar un ranking.</p>
        )}
      </div>
    </div>
  );
};

export default AnalyticsSummary;

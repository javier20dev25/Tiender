
import React from 'react';

type ProductSummary = {
  id: string;
  title: string;
  image_url: string | null;
  total_added_to_cart: number;
};

type AnalyticsProductTableProps = {
  data: ProductSummary[];
};

export const AnalyticsProductTable: React.FC<AnalyticsProductTableProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="mt-4 bg-gray-800 p-4 rounded-lg">
        <h3 className="text-white font-bold mb-2">Productos Añadidos al Carrito</h3>
        <p className="text-gray-400">Ningún producto fue añadido al carrito en este período.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 bg-gray-800 p-4 rounded-lg">
      <h3 className="text-white font-bold mb-4">Productos Añadidos al Carrito</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {data.map(product => (
          <div key={product.id} className="flex items-center bg-gray-700/50 p-2 rounded-md">
            <img 
              src={product.image_url || 'https://placehold.co/100x100'} 
              alt={product.title} 
              className="w-12 h-12 object-cover rounded-md mr-4"
            />
            <div className="flex-grow">
              <p className="font-semibold text-white">{product.title}</p>
            </div>
            <div className="text-right">
                <p className="text-lg font-bold text-purple-400">{product.total_added_to_cart}</p>
                <p className="text-xs text-gray-400">veces</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

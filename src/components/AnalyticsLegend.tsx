
import React from 'react';

export const AnalyticsLegend: React.FC = () => {
  const gradient = 'linear-gradient(to right, rgba(239, 68, 68, 0.1), #ef4444)';

  return (
    <div className="p-4 bg-gray-800 rounded-lg h-full">
      <h4 className="font-bold text-white mb-4">Leyenda</h4>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-300 mb-1">Menos visitas</p>
          <div
            className="h-6 w-full rounded-md"
            style={{ background: gradient }}
          />
          <p className="text-sm text-gray-300 mt-1">Más visitas</p>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className="w-6 h-6 rounded-md flex-shrink-0"
            style={{ border: '2px solid #8b5cf6' }}
          />
          <p className="text-sm text-gray-300">Añadido al carrito</p>
        </div>
      </div>
    </div>
  );
};

// src/components/AnalyticsHeatmap.tsx
import React from 'react';

type HeatmapData = {
  hour: string;
  visits: number;
  adds_to_cart: number;
};

type AnalyticsHeatmapProps = {
  data: HeatmapData[];
  startDate: Date;
};

export const AnalyticsHeatmap: React.FC<AnalyticsHeatmapProps> = ({ data, startDate }) => {
  const dataMap = new Map<string, HeatmapData>();
  data.forEach(d => {
    const key = new Date(d.hour).toISOString().substring(0, 13);
    dataMap.set(key, d);
  });

  const maxVisits = Math.max(...data.map(d => d.visits), 1);

  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startDate);
    day.setUTCDate(startDate.getUTCDate() + i);
    return day;
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dayLabels = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  return (
    <div className="p-4 bg-slate-50 overflow-x-auto custom-scrollbar">
      <div className="min-w-[560px]">
        <div className="flex text-[9px] font-black text-slate-400 mb-2.5 text-center uppercase tracking-tighter">
          <div className="w-7">&nbsp;</div>
          {hours.map(hour => (
            <div key={hour} className="w-5 flex-shrink-0">{hour}</div>
          ))}
        </div>

        <div className="space-y-1">
          {days.map(day => {
            const dayOfWeek = day.getUTCDay();
            return (
              <div key={day.toISOString()} className="flex items-center gap-1.5">
                <div className="w-7 text-[10px] font-bold text-slate-500 text-center">
                  {dayLabels[dayOfWeek]}
                </div>
                <div className="flex gap-1">
                  {hours.map(hour => {
                    const cellDate = new Date(day);
                    cellDate.setUTCHours(hour, 0, 0, 0);
                    const key = cellDate.toISOString().substring(0, 13);
                    const cellData = dataMap.get(key);

                    const visits = cellData?.visits || 0;
                    const addsToCart = cellData?.adds_to_cart || 0;

                    const opacity = visits > 0 ? 0.2 + (visits / maxVisits) * 0.8 : 0;

                    return (
                      <div
                        key={key}
                        className="w-5 h-5 rounded-md transition-all duration-200 relative group cursor-pointer"
                        style={{
                          backgroundColor: visits > 0 ? `rgba(244, 63, 94, ${opacity})` : 'rgba(226, 232, 240, 0.7)',
                          border: addsToCart > 0 ? '2px solid #0284c7' : 'none',
                          boxShadow: addsToCart > 0 ? '0 0 6px rgba(2, 132, 199, 0.35)' : 'none'
                        }}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                          <p className="text-slate-400 mb-1">{cellDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div>
                              {visits} Visitas
                            </span>
                            <span className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-sky-400"></div>
                              {addsToCart} Carrito
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

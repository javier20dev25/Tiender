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
    <div className="p-4 bg-zinc-950/50 rounded-2xl overflow-x-auto custom-scrollbar">
      <div className="min-w-[600px]">
        <div className="flex text-[9px] font-black text-zinc-600 mb-3 text-center uppercase tracking-tighter">
          <div className="w-8">&nbsp;</div>
          {hours.map(hour => (
            <div key={hour} className="w-6 flex-shrink-0">{hour}</div>
          ))}
        </div>

        <div className="space-y-1.5">
          {days.map(day => {
            const dayOfWeek = day.getUTCDay();
            return (
              <div key={day.toISOString()} className="flex items-center gap-1.5">
                <div className="w-8 text-[10px] font-bold text-zinc-500 text-center">
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

                    const opacity = visits > 0 ? 0.1 + (visits / maxVisits) * 0.9 : 0;

                    return (
                      <div
                        key={key}
                        className="w-6 h-6 rounded-md transition-all duration-300 relative group cursor-crosshair"
                        style={{
                          backgroundColor: visits > 0 ? `rgba(255, 77, 77, ${opacity})` : 'rgba(255, 255, 255, 0.03)',
                          border: addsToCart > 0 ? '2px solid #00F0FF' : 'none',
                          boxShadow: addsToCart > 0 ? '0 0 10px rgba(0, 240, 255, 0.3)' : 'none'
                        }}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                          <p className="text-zinc-500 mb-1">{cellDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-brand-pink"></div>
                              {visits} Visitas
                            </span>
                            <span className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan"></div>
                              {addsToCart} Interés
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

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

// Helper to get the day of the week (0=Sun, 1=Mon, ...)
const getDayOfWeek = (date: Date) => date.getUTCDay();

export const AnalyticsHeatmap: React.FC<AnalyticsHeatmapProps> = ({ data, startDate }) => {
  // Create a map for quick lookup
  const dataMap = new Map<string, HeatmapData>();
  data.forEach(d => {
    // Key by YYYY-MM-DD-HH
    const key = new Date(d.hour).toISOString().substring(0, 13);
    dataMap.set(key, d);
  });

  const maxVisits = Math.max(...data.map(d => d.visits), 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startDate);
    day.setUTCDate(startDate.getUTCDate() + i);
    return day;
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="p-4 bg-gray-800 rounded-lg overflow-x-auto">
      <div className="flex text-xs text-center text-gray-400 mb-2">
        <div className="w-12">&nbsp;</div> {/* Spacer for day labels */}
        {hours.map(hour => (
          <div key={hour} className="w-8 flex-shrink-0">{hour.toString().padStart(2, '0')}</div>
        ))}
      </div>
      <div className="flex">
        <div className="flex flex-col text-xs text-gray-400">
           {days.map(day => (
              <div key={day.toISOString()} className="h-8 flex items-center justify-center w-12 pr-2">
                {dayLabels[getDayOfWeek(day)]} {day.getUTCDate()}
              </div>
           ))}
        </div>
        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {days.map(day => {
            return hours.map(hour => {
              const cellDate = new Date(day);
              cellDate.setUTCHours(hour, 0, 0, 0);
              const key = cellDate.toISOString().substring(0, 13);
              const cellData = dataMap.get(key);

              const visits = cellData?.visits || 0;
              const addsToCart = cellData?.adds_to_cart || 0;

              const opacity = maxVisits > 0 ? visits / maxVisits : 0;
              const bgColor = `rgba(239, 68, 68, ${opacity})`; // Red-500 with variable alpha

              const border = addsToCart > 0 ? '2px solid #8b5cf6' : 'none'; // Purple-500 border

              const title = `${cellDate.toLocaleString('es-ES', { weekday: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })}\nVisitas: ${visits}\nAñadido al carrito: ${addsToCart}`;

              return (
                <div
                  key={key}
                  className="w-8 h-8 rounded-md transition-transform duration-150 hover:scale-125 hover:z-10"
                  style={{ backgroundColor: bgColor, border }}
                  title={title}
                />
              );
            });
          })}
        </div>
      </div>
    </div>
  );
};

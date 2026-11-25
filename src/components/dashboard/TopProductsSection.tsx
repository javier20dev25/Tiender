import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Share2, Heart, X as DislikeIcon, ShoppingCart } from 'lucide-react';

export interface TopProductItem {
  id: string;
  title: string;
  image_url: string | null;
  likes: number;
  dislikes: number;
  added_to_cart: number;
  score: number;
}

interface TopProductsSectionProps {
  topProducts: TopProductItem[];
  loading: boolean;
  onShareTopClick: () => void;
}

export const TopProductsSection: React.FC<TopProductsSectionProps> = ({
  topProducts,
  loading,
  onShareTopClick,
}) => {
  const getRankBadge = (index: number) => {
    if (index === 0) return 'bg-amber-100 text-amber-800 border-amber-300';
    if (index === 1) return 'bg-violet-100 text-violet-800 border-violet-200';
    if (index === 2) return 'bg-rose-100 text-rose-800 border-rose-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-[28px] bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Top Productos</h3>
              <p className="text-xs text-slate-500">Ranking por likes, carrito y puntaje</p>
            </div>
          </div>
          <button
            onClick={onShareTopClick}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartir Top</span>
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-2"></div>
            Cargando ranking...
          </div>
        ) : topProducts.length > 0 ? (
          <div className="space-y-2.5">
            {topProducts.slice(0, 5).map((product, index) => (
              <motion.div
                key={product.id}
                whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/70 transition-all"
              >
                <span
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black border flex-shrink-0 ${getRankBadge(
                    index
                  )}`}
                >
                  #{index + 1}
                </span>
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                  <img
                    src={product.image_url || 'https://placehold.co/80x80'}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{product.title}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> {product.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <DislikeIcon className="w-3.5 h-3.5 text-slate-400" /> {product.dislikes}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShoppingCart className="w-3.5 h-3.5 text-violet-600" /> {product.added_to_cart}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 px-2">
                  <div className="text-base font-black text-violet-700 leading-tight">{product.score}</div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Pts</div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-xs text-slate-500 italic bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 p-6">
            Aún no hay suficientes interacciones para armar el Top. Comparte tu tienda para empezar a medir.
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Actualización automática</span>
        <span>Top 5 productos</span>
      </div>
    </motion.div>
  );
};

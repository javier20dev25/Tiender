import React from 'react';
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
  return (
    <div className="p-6 rounded-[30px] bg-zinc-900 border border-white/5 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">Top Productos</h3>
            <p className="text-[11px] text-zinc-500">Ranking por likes, carrito y puntaje</p>
          </div>
        </div>
        <button
          onClick={onShareTopClick}
          className="px-4 py-2 rounded-xl bg-brand-cyan text-brand-dark font-bold text-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Compartir Top</span>
        </button>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-zinc-500">Cargando ranking...</div>
      ) : topProducts.length > 0 ? (
        <div className="space-y-2.5">
          {topProducts.slice(0, 5).map((product, index) => (
            <div
              key={product.id}
              className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-800/40 border border-white/5"
            >
              <span className="text-base font-black text-brand-cyan w-6 text-center flex-shrink-0">
                #{index + 1}
              </span>
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
                <img
                  src={product.image_url || 'https://placehold.co/80x80'}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-xs font-bold text-white truncate">{product.title}</p>
                <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-brand-pink" /> {product.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <DislikeIcon className="w-3 h-3 text-zinc-500" /> {product.dislikes}
                  </span>
                  <span className="flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3 text-brand-cyan" /> {product.added_to_cart}
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0 px-2">
                <div className="text-sm font-black text-brand-neon">{product.score}</div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Pts</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-zinc-500 italic">
          Aún no hay suficientes interacciones para armar el Top. Comparte tu tienda para empezar a medir.
        </div>
      )}
    </div>
  );
};

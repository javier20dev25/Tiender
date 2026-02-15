// src/components/PlanCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

export interface PlanCardProps {
  planName: string;
  price: string;
  features: string[];
  onSelect: () => void;
  loading: boolean;
  isFeatured?: boolean;
  buttonText?: string;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  planName, price, features, onSelect, loading, isFeatured, buttonText = 'Iniciar Prueba Gratis'
}) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`relative p-8 rounded-[40px] bg-zinc-900 border ${isFeatured ? 'border-brand-pink/30' : 'border-white/5'} flex flex-col shadow-2xl overflow-hidden group`}
    >
      {/* Glow Effect */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] -z-10 transition-opacity group-hover:opacity-100 opacity-50 ${isFeatured ? 'bg-brand-pink/20' : 'bg-brand-cyan/20'}`}></div>

      {isFeatured && (
        <div className="absolute top-6 right-6 px-3 py-1 bg-brand-pink text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-brand-pink/20 flex items-center gap-1 italic">
          <Sparkles className="w-2.5 h-2.5" /> Más Popular
        </div>
      )}

      <div className="mb-10 text-left">
        <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${isFeatured ? 'text-brand-pink' : 'text-brand-cyan'}`}>{planName}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-black text-white italic tracking-tighter uppercase">{price}</span>
          <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">/mes</span>
        </div>
      </div>

      <ul className="space-y-5 mb-12 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3 group/item">
            <div className={`p-1 rounded-lg ${isFeatured ? 'bg-brand-pink/10 text-brand-pink' : 'bg-brand-cyan/10 text-brand-cyan'}`}>
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-medium text-zinc-400 group-hover/item:text-white transition-colors">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={loading}
        className={`w-full py-5 rounded-[22px] font-black uppercase tracking-tighter italic text-sm transition-all shadow-xl flex items-center justify-center gap-2
            ${isFeatured
            ? 'bg-sunset-gradient text-white shadow-brand-pink/10 hover:shadow-brand-pink/30 hover:scale-[1.02]'
            : 'bg-zinc-800 text-white hover:bg-zinc-700 hover:scale-[1.02]'
          } disabled:opacity-50
        `}
      >
        {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : buttonText}
      </button>

      {isFeatured && (
        <p className="mt-4 text-center text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Ahorra 20% en facturación anual</p>
      )}
    </motion.div>
  );
};

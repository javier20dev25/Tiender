// src/components/SubscriptionStatusBanner.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, XCircle, Clock, ExternalLink } from 'lucide-react';

import type { Subscription } from '../types';

interface SubscriptionStatusBannerProps {
  subscription: Subscription | null;
}

const SubscriptionStatusBanner: React.FC<SubscriptionStatusBannerProps> = ({ subscription }) => {
  if (!subscription) return null;

  const { status, current_period_end } = subscription;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'pronto';
    return new Date(dateString).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
    });
  };

  const containerClasses = "p-5 rounded-[25px] border flex items-start gap-4 mb-8 shadow-2xl relative overflow-hidden";
  const iconBoxClasses = "p-3 rounded-2xl flex-shrink-0";

  switch (status) {
    case 'past_due':
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`${containerClasses} bg-red-500/10 border-red-500/20`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] -z-10"></div>
          <div className={`${iconBoxClasses} bg-red-500/20 text-red-500`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-grow">
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1 italic">Atención: Pago Fallido</h4>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
              Tu último pago no pudo procesarse. Por favor, revisa tus datos para evitar interrupciones en tu tienda.
            </p>
          </div>
          <button className="px-4 py-2 bg-red-500 text-white text-[10px] font-black uppercase rounded-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
            Actualizar <ExternalLink className="w-3 h-3" />
          </button>
        </motion.div>
      );

    case 'unpaid':
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`${containerClasses} bg-red-500/5 border-red-500/30`}>
          <div className={`${iconBoxClasses} bg-red-500/20 text-red-500`}>
            <XCircle className="w-6 h-6" />
          </div>
          <div className="flex-grow">
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">Suscripción Suspendida</h4>
            <p className="text-xs text-zinc-500 font-medium">No hemos podido cobrar tu mensualidad. Tu tienda ya no es visible para el público.</p>
          </div>
          <button className="px-6 py-2.5 bg-white text-black text-[10px] font-black uppercase rounded-xl transition-transform hover:scale-105">
            Reactivar Ahora
          </button>
        </motion.div>
      );

    case 'canceled':
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`${containerClasses} bg-brand-yellow/5 border-brand-yellow/20`}>
          <div className={`${iconBoxClasses} bg-brand-yellow/20 text-brand-yellow`}>
            <Clock className="w-6 h-6" />
          </div>
          <div className="flex-grow">
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1 italic">Suscripción Finaliza Pronto</h4>
            <p className="text-xs text-zinc-400 font-medium">
              Tu plan Full vence el <span className="text-brand-yellow font-bold">{formatDate(current_period_end)}</span>. Conservarás tus funciones premium hasta entonces.
            </p>
          </div>
          <button className="px-6 py-2 bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/30 text-[10px] font-black uppercase rounded-xl transition-all hover:bg-brand-yellow hover:text-brand-dark">
            Renovar
          </button>
        </motion.div>
      );

    case 'active':
    case 'trialing':
    default:
      return null;
  }
};

export default SubscriptionStatusBanner;

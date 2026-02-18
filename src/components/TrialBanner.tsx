import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Rocket, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TrialBanner: React.FC = () => {
    const { store, subscription } = useAuth();

    // Si tiene una suscripción activa de PayPal, no mostramos el banner de trial
    if (subscription?.status === 'active' || subscription?.status === 'trialing') {
        return null;
    }

    if (!store?.trial_ends_at) return null;

    const trialEnds = new Date(store.trial_ends_at);
    const now = new Date();
    const diffTime = trialEnds.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return null; // El periodo ya venció (ProtectedRoute se encargará de redirigir)

    const isLastDays = diffDays <= 2;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`w-full overflow-hidden ${isLastDays ? 'bg-red-500/10 border-b border-red-500/20' : 'bg-brand-pink/5 border-b border-brand-pink/20'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        {isLastDays ? (
                            <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                        ) : (
                            <Clock className="w-4 h-4 text-brand-pink" />
                        )}
                        <p className={`text-[11px] font-bold uppercase tracking-wider ${isLastDays ? 'text-red-500' : 'text-zinc-400'
                            }`}>
                            {diffDays === 0 ? (
                                <span>¡Tu prueba gratuita termina <span className="text-white italic">hoy</span>!</span>
                            ) : (
                                <span>Quedan <span className="text-white italic">{diffDays} días</span> de prueba gratuita para tu plan <span className="text-white italic capitalize">{store.plan_type}</span></span>
                            )}
                        </p>
                    </div>

                    <Link
                        to="/upgrade"
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter italic transition-all ${isLastDays
                                ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'
                                : 'bg-brand-pink text-white hover:scale-105 shadow-lg shadow-brand-pink/20'
                            }`}
                    >
                        <Rocket className="w-3 h-3" />
                        Suscribirme Ahora
                    </Link>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default TrialBanner;

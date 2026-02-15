// src/components/CancellationModal.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Trash2 } from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CancellationModal: React.FC<CancellationModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmCancellation = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: funcError } = await getSupabase().functions.invoke('cancel-paypal-subscription');
      if (funcError) {
        throw new Error(funcError.message || 'Ocurrió un error al procesar la cancelación.');
      }
      onSuccess();
    } catch (e: any) {
      setError(e.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-dark/90 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-zinc-900 border border-white/5 rounded-[40px] shadow-2xl overflow-hidden p-8"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>

              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter mb-4">¿Cancelar Suscripción?</h2>

              <p className="text-sm text-zinc-500 font-medium leading-relaxed mb-8">
                Tu acceso a las funciones premium (analíticas avanzadas, ofertas "match", etc.)
                se mantendrá activo hasta el final de tu ciclo de facturación actual.
              </p>

              {error && (
                <div className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold mb-6 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 w-full gap-3">
                <button
                  onClick={handleConfirmCancellation}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-red-500 text-white font-black uppercase tracking-tighter italic flex items-center justify-center gap-2 hover:bg-red-600 transition-all disabled:opacity-30"
                >
                  {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Trash2 className="w-4 h-4" />}
                  {loading ? 'Procesando' : 'Sí, confirmar cancelación'}
                </button>
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-zinc-800 text-zinc-400 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors"
                >
                  Mantener mi plan premium
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CancellationModal;

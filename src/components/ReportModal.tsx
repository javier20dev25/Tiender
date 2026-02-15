// src/components/ReportModal.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

interface ReportModalProps {
  report: string;
  onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ report, onClose }) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-dark/90 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-zinc-900 border border-white/5 rounded-[40px] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-yellow/10 flex items-center justify-center text-brand-yellow">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Reporte IA Premium</h2>
              <p className="text-zinc-500 text-xs font-medium">Análisis profundo de tu rendimiento</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl bg-zinc-800 text-zinc-400 hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto custom-scrollbar p-8">
          <div className="bg-zinc-800/30 border border-white/5 rounded-3xl p-8">
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="whitespace-pre-wrap font-medium text-zinc-300 leading-relaxed text-sm">
                {report}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-zinc-950 border-t border-white/5 flex items-center justify-end shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <button
            onClick={onClose}
            className="px-10 py-4 rounded-[20px] bg-white text-black font-black uppercase tracking-tighter italic flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Entendido
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportModal;

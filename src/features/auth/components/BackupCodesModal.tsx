// src/features/auth/components/BackupCodesModal.tsx
import React from 'react';

interface BackupCodesModalProps {
  codes: string[] | null;
  isLoading: boolean;
  onClose: () => void;
  onDownload: () => void;
  onConfirm: () => void;
}

const BackupCodesModal: React.FC<BackupCodesModalProps> = ({ codes, isLoading, onClose, onDownload, onConfirm }) => {

  return (
    <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center z-[999] p-6">
      <div className="relative bg-zinc-900 border border-white/5 p-8 sm:p-10 rounded-[40px] shadow-2xl w-full max-w-md text-center max-h-[90vh] overflow-hidden flex flex-col">
        <div className="overflow-y-auto custom-scrollbar pr-2 flex-grow">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center">
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Generando Códigos...</h2>
              <p className="text-zinc-500 text-xs font-medium mb-8">
                Estamos creando tus llaves maestras de recuperación.
              </p>
              <div className="w-12 h-12 border-4 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : codes ? (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Guardado Seguro</h2>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                  Estos son tus códigos de recuperación únicos. <br />
                  <span className="text-brand-pink font-bold">Guárdalos ahora mismo.</span> Es la única forma de recuperar tu cuenta si pierdes el acceso.
                </p>
              </div>

              <div id="recovery-codes-content" className="bg-zinc-800/50 border border-white/5 p-6 rounded-3xl mb-8 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <div className="w-20 h-20 border-4 border-white rounded-full"></div>
                </div>
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Tus Llaves Maestras:</h3>
                <div className="grid grid-cols-1 gap-3">
                  {codes.map((code, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-zinc-600 tabular-nums">{(index + 1).toString().padStart(2, '0')}.</span>
                      <span className="font-mono text-lg font-bold text-brand-neon tracking-widest bg-brand-neon/5 px-3 py-1 rounded-lg border border-brand-neon/10 w-full text-center">
                        {code}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col space-y-4">
                <button
                  onClick={onDownload}
                  className="w-full px-8 py-5 bg-white text-black font-black uppercase tracking-tighter italic rounded-[22px] shadow-xl shadow-white/5 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Descargar PNG de Seguridad
                </button>
                <button
                  onClick={onConfirm}
                  className="w-full px-8 py-5 bg-brand-pink/10 border border-brand-pink/20 text-brand-pink font-black uppercase tracking-tighter italic rounded-[22px] hover:bg-brand-pink hover:text-white transition-all"
                >
                  He Guardado mis Códigos
                </button>
              </div>
            </>
          ) : (
            <div className="py-12">
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4 text-red-500">Error</h2>
              <p className="text-zinc-500 text-sm mb-8">
                No pudimos generar tus códigos. Por favor, intenta de nuevo.
              </p>
              <button
                onClick={onClose}
                className="w-full px-8 py-4 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-all uppercase tracking-widest text-xs"
              >
                Cerrar y Reintentar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackupCodesModal;

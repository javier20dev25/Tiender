// src/components/MobileMenu.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCancelModal: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, onOpenCancelModal }) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
    onClose();
  };

  const handleCancelClick = () => {
    onOpenCancelModal();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-brand-dark/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-[110] w-72 bg-brand-dark border-r border-white/5 shadow-2xl p-8 flex flex-col"
          >
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sunset-gradient flex items-center justify-center font-black italic text-brand-dark">T</div>
                <span className="font-display font-bold text-white tracking-tight italic uppercase">Tiender</span>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-grow space-y-6">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest pl-4 mb-2">Cuenta</div>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-900 border border-white/5 text-white font-medium hover:bg-zinc-800 transition-all text-sm">
                  <User className="w-4 h-4 text-brand-neon" />
                  <span>Perfil (Pronto)</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-zinc-400 font-medium hover:bg-zinc-900 hover:text-white transition-all text-sm">
                  <Settings className="w-4 h-4" />
                  <span>Configurar Tienda</span>
                </button>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest pl-4 mb-2">Facturación</div>
                <button
                  onClick={handleCancelClick}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-zinc-400 font-medium hover:bg-zinc-900 hover:text-white transition-all text-sm"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Gestionar Plan</span>
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/5">
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 border border-white/5">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{user?.phone || user?.email}</p>
                  <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-tight">Vendedor Autenticado</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;

// src/components/MobileMenu.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCancelModal: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, onOpenCancelModal }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  
  const handleCancelSubscription = () => {
    onOpenCancelModal(); // Abre el modal de cancelación
    onClose(); // Cierra el menú
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
      onClick={onClose}
      aria-hidden="true"
    >
      <div 
        className="fixed inset-y-0 left-0 z-50 h-full w-64 transform bg-white shadow-xl transition-transform duration-300 ease-in-out"
        onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del menú lo cierre
      >
        <div className="flex h-full flex-col justify-between">
          <div className="p-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Menú</h2>
              <button 
                onClick={onClose} 
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Cerrar menú"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <ul className="space-y-2">
              <li>
                <button
                  onClick={handleCancelSubscription}
                  className="w-full text-left rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  Cancelar Suscripción
                </button>
              </li>
            </ul>
          </div>

          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleSignOut}
              className="w-full rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;

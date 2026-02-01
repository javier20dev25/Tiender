// src/components/CancellationModal.tsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

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
      const { error: funcError } = await supabase.functions.invoke('cancel-paypal-subscription');
      if (funcError) {
        throw new Error(funcError.message || 'Ocurrió un error al procesar la cancelación.');
      }
      onSuccess(); // Llama a la función de éxito pasada por props
    } catch (e) {
      let errorMessage = 'Ocurrió un error inesperado.';
      if (e instanceof Error) {
        errorMessage = e.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900">Confirmar Cancelación</h2>
        <p className="mt-2 text-gray-600">
          ¿Estás seguro de que quieres cancelar tu suscripción? Tu acceso a las funciones premium
          permanecerá activo hasta el final de tu ciclo de facturación actual.
        </p>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Volver
          </button>
          <button
            onClick={handleConfirmCancellation}
            disabled={loading}
            className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Procesando...' : 'Sí, Cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancellationModal;

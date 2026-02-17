import React, { useState } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { PlanCard } from '../components/PlanCard';
import { useAuth } from '../context/AuthContext';
import CancellationModal from '../components/CancellationModal';

type PlanType = 'standard' | 'full';

// --- Main Page Component ---
const UpgradePage: React.FC = () => {
  const { store, loading: authLoading } = useAuth();
  const [isModalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState<PlanType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePlanSelection = async (planType: PlanType) => {
    setLoading(planType);
    setError(null);
    try {
      console.log('[UpgradePage] Calling create-paypal-subscription with planType:', planType);
      const { data, error: functionError } = await getSupabase().functions.invoke(
        'create-paypal-subscription',
        { body: { planType } }
      );
      if (functionError) {
        console.error('[UpgradePage] Function error:', functionError);
        throw new Error(`Error de la función: ${functionError.message}`);
      }
      console.log('[UpgradePage] Function response data:', data);
      if (data?.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        throw new Error('No se recibió una URL de aprobación de PayPal.');
      }
    } catch (e) {
      console.error('Error al crear la suscripción de PayPal:', e);
      const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error inesperado.';
      setError(`Error al iniciar la suscripción: ${errorMessage}`);
      setLoading(null);
    }
  };

  const handleCancelSuccess = () => {
    setModalOpen(false);
    // Idealmente, aquí se mostraría un toast o una notificación más elegante.
    alert("Tu solicitud de cancelación ha sido enviada. El estado de tu cuenta se actualizará en breve.");
    // Podríamos forzar una recarga de los datos del usuario si fuera necesario.
  };

  if (authLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Cargando información de tu cuenta...</p>
      </div>
    );
  }

  // --- Vista de Gestión para usuarios con plan activo ---
  if (store && (store.plan_type === 'standard' || store.plan_type === 'full')) {
    return (
      <>
        <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <header className="mb-6 border-b pb-6">
              <h1 className="text-3xl font-bold text-gray-900">Gestionar Suscripción</h1>
              <p className="text-lg text-gray-600 mt-2">
                Actualmente estás en el plan <span className="font-semibold capitalize text-indigo-600">{store.plan_type}</span>.
              </p>
            </header>
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-800">Cancelar tu suscripción</h2>
              <p className="mt-2 text-gray-600">
                Puedes cancelar tu suscripción en cualquier momento. Tu acceso a las funciones premium continuará
                hasta el final de tu ciclo de facturación actual.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-6 w-full rounded-lg bg-red-600 px-5 py-3 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300"
              >
                Solicitar Cancelación de Suscripción
              </button>
            </div>
          </div>
        </div>
        <CancellationModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={handleCancelSuccess}
        />
      </>
    );
  }

  // --- Vista de Venta para usuarios sin plan o en trial ---
  const standardFeatures = ["Hasta 30 productos", "Analíticas básicas de visitas", "Integración con WhatsApp"];
  const fullFeatures = ["Hasta 60 productos", "Analíticas y reportes de IA", "Integración con WhatsApp", "Chat con IA (Próximamente)", "Sin branding 'Crea tu tienda...'"];

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-2">Elige el Plan Perfecto Para Ti</h1>
          <p className="text-lg text-gray-600">Comienza con una prueba gratuita de 7 días en cualquier plan. Cancela cuando quieras.</p>
        </header>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <PlanCard
            planName="Standard"
            price="$10"
            features={standardFeatures}
            onSelect={() => handlePlanSelection('standard')}
            loading={loading === 'standard'}
          />
          <PlanCard
            planName="Full"
            price="$25"
            features={fullFeatures}
            onSelect={() => handlePlanSelection('full')}
            loading={loading === 'full'}
            isFeatured={true}
          />
        </div>
      </div>
    </div>
  );
};

export default UpgradePage;

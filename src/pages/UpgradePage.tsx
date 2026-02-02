import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PlanCard } from '../components/PlanCard'; // Importar el componente compartido

type PlanType = 'standard' | 'full';

// --- Main Page Component ---
const UpgradePage: React.FC = () => {
  const [loading, setLoading] = useState<PlanType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePlanSelection = async (planType: PlanType) => {
    setLoading(planType);
    setError(null);

    try {
      // Para un flujo de nuevo usuario, llamamos a 'create-paypal-subscription'.
      // La función 'revise-paypal-subscription' es para usuarios que ya tienen una suscripción activa.
      const { data, error: functionError } = await supabase.functions.invoke(
        'create-paypal-subscription',
        {
          body: { planType },
        }
      );

      if (functionError) {
        throw new Error(`Error de la función: ${functionError.message}`);
      }
      
      if (data?.approvalUrl) {
        // Redirige al usuario a PayPal para que apruebe la suscripción (y el trial).
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

  const standardFeatures = [
    "Hasta 30 productos",
    "Analíticas básicas de visitas",
    "Integración con WhatsApp",
  ];

  const fullFeatures = [
    "Hasta 60 productos",
    "Analíticas y reportes de IA",
    "Integración con WhatsApp",
    "Chat con IA (Próximamente)",
    "Sin branding 'Crea tu tienda...'",
  ];

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

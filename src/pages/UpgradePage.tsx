import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getSupabase } from '../lib/supabaseClient';
import { PlanCard } from '../components/PlanCard';
import { useAuth } from '../context/AuthContext';
import CancellationModal from '../components/CancellationModal';

type PlanType = 'standard' | 'full';

// --- Main Page Component ---
const UpgradePage: React.FC = () => {
  const { store, subscription, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [isModalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState<PlanType | null>(null);
  const [isAutoProcessing, setIsAutoProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determinar si el usuario tiene una suscripción de PayPal activa (no solo trial)
  const hasActivePayPalSubscription = subscription?.status === 'active' || subscription?.status === 'trialing';
  const isTrialActive = store?.trial_ends_at ? new Date(store.trial_ends_at) > new Date() : false;

  // Si el usuario tiene una suscripción activa, permitir gestión
  // Si no tiene suscripción Y el trial ya venció, se queda en /upgrade para elegir plan con PayPal
  // Si está en trial, permitimos que se quede aquí para CAMBIAR de plan de prueba (sin pago)
  useEffect(() => {
    if (!authLoading && subscription?.status === 'active') {
      // Si tiene suscripción activa de PayPal, no necesita estar en la vista de venta
    }
  }, [authLoading, subscription]);

  // Auto-trigger plan selection if 'plan' param is present AND trial expired AND no active sub
  useEffect(() => {
    const planParam = searchParams.get('plan') as PlanType;

    // Solo auto-disparar si:
    // 1. Hay un parámetro de plan.
    // 2. TENEMOS los datos de la tienda cargados (store !== null).
    // 3. NO tiene suscripción activa de PayPal.
    // 4. El trial ya venció.
    // 5. No estamos ya procesando algo.
    if (planParam && store && !hasActivePayPalSubscription && !isTrialActive && !loading && !error && !isAutoProcessing) {
      if (planParam === 'standard' || planParam === 'full') {
        setIsAutoProcessing(true);
        handlePlanSelection(planParam);
      }
    }
  }, [searchParams, store, subscription, loading, error, isAutoProcessing, hasActivePayPalSubscription, isTrialActive]);

  const handlePlanSelection = async (planType: PlanType) => {
    setLoading(planType);
    setError(null);
    try {
      if (isTrialActive && !hasActivePayPalSubscription) {
        // --- FLUJO DE PRUEBA GRATUITA ---
        console.log('[UpgradePage] Trial active, updating plan locally in DB:', planType);
        const { error: updateError } = await getSupabase()
          .from('stores')
          .update({ plan_type: planType })
          .eq('user_id', store?.user_id);

        if (updateError) throw updateError;
        
        // Refrescar la página o navegar al dashboard
        alert(`¡Plan ${planType.toUpperCase()} activado para tu prueba gratuita!`);
        window.location.href = '/dashboard';
        return;
      }

      // --- FLUJO DE PAGO (Trial vencido o suscripción explícita) ---
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
      console.error('Error al seleccionar el plan:', e);
      const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error inesperado.';
      setError(`Error al procesar tu solicitud: ${errorMessage}`);
      setLoading(null);
    }
  };

  const handleCancelSuccess = () => {
    setModalOpen(false);
    // Idealmente, aquí se mostraría un toast o una notificación más elegante.
    alert("Tu solicitud de cancelación ha sido enviada. El estado de tu cuenta se actualizará en breve.");
    // Podríamos forzar una recarga de los datos del usuario si fuera necesario.
  };

  if (authLoading || isAutoProcessing) {
    return (
      <div className="bg-brand-dark min-h-screen flex flex-col items-center justify-center text-white p-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-brand-pink border-t-transparent rounded-full mb-6"
        />
        <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Preparando Transmisión</h2>
        <p className="text-zinc-500 font-medium animate-pulse">
          {isAutoProcessing ? 'Redirigiendo a PayPal para activar tu plan...' : 'Cargando información de tu cuenta...'}
        </p>
      </div>
    );
  }

  // --- Vista de Gestión SOLO para usuarios con suscripción PayPal activa ---
  if (store && hasActivePayPalSubscription) {
    return (
      <>
        <div className="bg-brand-dark min-h-screen p-4 sm:p-8">
          <div className="max-w-2xl mx-auto bg-zinc-900 border border-white/5 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-pink via-brand-neon to-brand-cyan opacity-50"></div>
            <header className="mb-6 border-b border-white/5 pb-6">
              <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">Gestionar Suscripción</h1>
              <p className="text-sm text-zinc-400 mt-2 font-medium">
                Actualmente estás en el plan <span className="font-bold capitalize text-brand-neon px-2 py-1 bg-brand-neon/10 rounded-md ml-1">{store.plan_type}</span>.
              </p>
            </header>
            <div className="mt-8">
              <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Cancelar tu suscripción
              </h2>
              <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                Puedes cancelar tu suscripción en cualquier momento. Tu acceso a las funciones premium continuará
                hasta el final de tu ciclo de facturación actual.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-8 w-full rounded-2xl bg-red-500/10 border border-red-500/20 px-5 py-4 text-sm font-black uppercase tracking-tighter italic text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"
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
    <div className="bg-brand-dark min-h-screen p-4 sm:p-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-16 pt-8">
          <h1 className="text-5xl sm:text-6xl font-black text-white uppercase italic tracking-tighter mb-4 leading-tight">
            Elige el <span className="text-transparent bg-clip-text bg-sunset-gradient">Plan Perfecto</span><br/>Para Ti
          </h1>
          <p className="text-lg text-zinc-400 font-medium">Comienza con una prueba gratuita de 7 días. Cancela cuando quieras.</p>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-2xl relative mb-8 flex items-center gap-3 font-bold text-sm" role="alert">
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

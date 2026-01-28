import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Define los tipos de planes que se pueden seleccionar
type PlanType = 'standard' | 'full';

const UpgradePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpgrade = async (planType: PlanType) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Llama a la Edge Function 'revise-paypal-subscription'
      const { data, error: functionError } = await supabase.functions.invoke(
        'revise-paypal-subscription',
        {
          body: { planType },
        }
      );

      if (functionError) {
        throw new Error(functionError.message);
      }
      
      // La función de Supabase debería devolver una URL de aprobación de PayPal
      if (data?.approvalUrl) {
        // Redirige al usuario a PayPal para que apruebe el cambio
        window.location.href = data.approvalUrl;
      } else {
        setSuccess('Solicitud de cambio de plan procesada. Revisa tu estado en unos momentos.');
      }

    } catch (e: any) {
      console.error('Error al cambiar el plan de suscripción:', e);
      setError(`Error al procesar el cambio de plan: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Cambiar Plan de Suscripción</h1>
      <p>Selecciona el nuevo plan que deseas activar.</p>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <button 
          onClick={() => handleUpgrade('standard')}
          disabled={loading}
          style={buttonStyle}
        >
          {loading ? 'Procesando...' : 'Cambiar a Plan Standard'}
        </button>
        <button 
          onClick={() => handleUpgrade('full')}
          disabled={loading}
          style={buttonStyle}
        >
          {loading ? 'Procesando...' : 'Cambiar a Plan Full'}
        </button>
      </div>
    </div>
  );
};

// Estilos básicos para los botones
const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  fontSize: '16px',
  cursor: 'pointer',
  border: '1px solid #ccc',
  borderRadius: '5px',
};

export default UpgradePage;

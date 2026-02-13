// src/components/SubscriptionStatusBanner.tsx
import React from 'react';
import { Link } from 'react-router-dom';

// Define the types locally as this component is self-contained
type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'unpaid' | 'canceled';
interface Subscription {
  status: SubscriptionStatus;
  current_period_end: string | null;
}

interface SubscriptionStatusBannerProps {
  subscription: Subscription | null;
}

const SubscriptionStatusBanner: React.FC<SubscriptionStatusBannerProps> = ({ subscription }) => {
  if (!subscription) {
    return null; // No subscription, no banner
  }

  const { status, current_period_end } = subscription;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'una fecha no especificada';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  switch (status) {
    case 'past_due':
      return (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md w-full" role="alert">
          <p className="font-bold">Error en el Pago</p>
          <p>
            Tu último pago ha fallado. Por favor,{' '}
            <Link to="/upgrade" className="font-bold underline hover:text-red-800">
              actualiza tu información de facturación
            </Link>{' '}
            para mantener tu cuenta activa.
          </p>
        </div>
      );

    case 'unpaid':
        return (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md w-full" role="alert">
            <p className="font-bold">Suscripción Inactiva</p>
            <p>
              Tu suscripción está inactiva debido a un pago fallido. Para reactivarla, por favor{' '}
              <Link to="/upgrade" className="font-bold underline hover:text-red-800">
                realiza un nuevo pago
              </Link>.
            </p>
          </div>
        );

    case 'canceled':
      return (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md w-full" role="alert">
          <p className="font-bold">Suscripción Cancelada</p>
          <p>
            Tu suscripción ha sido cancelada y terminará el{' '}
            <strong>{formatDate(current_period_end)}</strong>. Puedes{' '}
            <Link to="/upgrade" className="font-bold underline hover:text-yellow-800">
              volver a suscribirte
            </Link>{' '}
            en cualquier momento.
          </p>
        </div>
      );

    case 'active':
    case 'trialing':
    default:
      // No banner for active or trialing states
      return null;
  }
};

export default SubscriptionStatusBanner;

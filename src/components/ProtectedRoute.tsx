import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import PageLoader from './PageLoader';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, subscription, store, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    // Si no hay usuario, siempre redirigir a la página de autenticación
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Define los estados que permiten el acceso a rutas protegidas.
  const hasActivePayPalSubscription = subscription?.status === 'active' || subscription?.status === 'trialing' || subscription?.status === 'past_due';

  // Nuevo: Verificar si el trial manual aún está vigente
  const isTrialActive = store?.trial_ends_at ? new Date(store.trial_ends_at) > new Date() : false;

  const hasAccess = hasActivePayPalSubscription || isTrialActive;

  if (hasAccess) {
    // Si el usuario tiene una suscripción activa o el trial vigente, permitir el acceso.
    return children;
  } else {
    // Para cualquier otro caso (canceled, unpaid, o sin suscripción/trial),
    // redirigir a la página de "upgrade".
    if (location.pathname !== '/upgrade') {
      return <Navigate to={`/upgrade${location.search}`} replace />;
    }
    // Si ya está en /upgrade, permite que la página se renderice.
    return children;
  }
};

export default ProtectedRoute;
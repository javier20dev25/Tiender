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
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // --- LOGIC FOR ACCESS CONTROL ---
  const isTrialActive = store?.trial_ends_at ? new Date(store.trial_ends_at) > new Date() : false;
  const isSubActive = subscription?.status === 'active' || subscription?.status === 'trialing' || subscription?.status === 'past_due';

  // Si tiene acceso (trial o suscripción activa), permitimos cualquier ruta protegida.
  if (isTrialActive || isSubActive) {
    return children;
  }

  // Si NO tiene acceso (trial vencido y sin suscripción activa):
  // 1. Si ya está en /upgrade, permitimos ver la página para que pueda pagar.
  if (location.pathname === '/upgrade') {
    return children;
  }

  // 2. Si intenta acceder a cualquier otra cosa, lo mandamos a /upgrade.
  return <Navigate to={`/upgrade${location.search}`} replace />;
};

export default ProtectedRoute;
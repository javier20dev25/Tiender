import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageLoader from './PageLoader';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ADMIN_EMAIL = 'sleytherelax18@gmail.com';

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, subscription, store, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  // 1. Verificación para Administrador Maestro
  const isAdmin =
    user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
    user?.user_metadata?.role === 'admin' ||
    localStorage.getItem('tiender_admin_authenticated') === 'true';

  if (isAdmin) {
    // Si el admin está en /admin, acceso total
    if (location.pathname === '/admin') {
      return children;
    }
    // Si intenta ir a cualquier otra ruta protegida (/dashboard, /upgrade), redirigir a /admin
    return <Navigate to="/admin" replace />;
  }

  // 2. Si no hay usuario autenticado, redirigir al inicio de sesión
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 3. Si un vendedor normal intenta ingresar a /admin, enviarlo a su dashboard
  if (location.pathname === '/admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // --- LOGIC FOR ACCESS CONTROL FOR VENDORS ---
  const isTrialActive = store?.trial_ends_at ? new Date(store.trial_ends_at) > new Date() : false;
  const isSubActive = subscription?.status === 'active' || subscription?.status === 'trialing' || subscription?.status === 'past_due';
  const isBillingExempt = !!store?.billing_exempt;

  // Si tiene acceso (trial, suscripción activa o exento de cobro), permitimos cualquier ruta protegida.
  if (isTrialActive || isSubActive || isBillingExempt) {
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

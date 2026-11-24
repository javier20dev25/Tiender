// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isMasterAdmin } from '../utils/admin';
import PageLoader from './PageLoader';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, store, subscription, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  // 1. Verificación para Administrador Maestro
  const adminEmail = typeof localStorage !== 'undefined' ? localStorage.getItem('tiender_admin_email') : null;
  const isAdminAuthenticated = typeof localStorage !== 'undefined' && localStorage.getItem('tiender_admin_authenticated') === 'true';
  const isAdmin =
    isMasterAdmin(user?.email, user?.user_metadata as Record<string, unknown>) ||
    (isAdminAuthenticated && isMasterAdmin(adminEmail));

  if (isAdmin) {
    // Si el admin está en /admin, acceso total
    if (location.pathname === '/admin') {
      return children;
    }
    // Si intenta ir a /dashboard o /upgrade, redirigir a /admin
    return <Navigate to="/admin" replace />;
  }

  // 2. Si no hay usuario autenticado, redirigir al inicio de sesión
  if (!user && !isAdminAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 3. Si un vendedor normal intenta ingresar a /admin, enviarlo a su dashboard
  if (location.pathname === '/admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Si la cuenta fue creada por el admin o es plan full / exenta
  const isCreatedByAdmin =
    user?.email?.endsWith('@tiender.app') ||
    Boolean(user?.user_metadata?.created_by_admin) ||
    Boolean(user?.user_metadata?.must_change_password) ||
    store?.billing_exempt ||
    store?.plan_type === 'full';

  if (isCreatedByAdmin) {
    return children;
  }

  // 5. Verificación de suscripción para vendedores normales
  const hasValidSubscription =
    subscription?.status === 'active' ||
    subscription?.status === 'trialing' ||
    subscription?.status === 'past_due';

  if (!hasValidSubscription) {
    if (location.pathname !== '/upgrade') {
      return <Navigate to="/upgrade" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;



import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store } from '../context/AuthContext'; // Asumiendo que Store está exportado desde AuthContext

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, store, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    // Si no hay usuario, redirigir a la página de autenticación
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Si el usuario está autenticado, verificar el estado de su tienda y plan
  if (store) {
    const isPaidPlan = store.plan_type === 'standard' || store.plan_type === 'full';
    const trialHasEnded = store.trial_ends_at && new Date(store.trial_ends_at) < new Date();

    if (!isPaidPlan && trialHasEnded) {
      // Si no tiene plan de pago y el trial ha expirado, redirigir a la página de upgrade
      // Asegurarse de que el usuario no esté ya en la página de upgrade para evitar bucles
      if (location.pathname !== '/upgrade') {
        return <Navigate to="/upgrade" replace />;
      }
    }
  } else {
    // Si el usuario está autenticado pero no tiene tienda (esto no debería pasar con el nuevo signup, pero como fallback)
    // Podríamos redirigir a un flujo de setup o a /upgrade también.
    // Por ahora, asumimos que si hay user, hay store
    console.warn("User authenticated but store data is missing. Redirecting to upgrade.");
    if (location.pathname !== '/upgrade') {
        return <Navigate to="/upgrade" replace />;
    }
  }

  // Si tiene un plan de pago o el trial está activo, permitir el acceso
  return children;
};

export default ProtectedRoute;

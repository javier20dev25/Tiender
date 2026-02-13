import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, subscription, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Muestra un indicador de carga mientras se obtiene el estado de autenticación y suscripción
    return <div>Loading session...</div>;
  }

  if (!user) {
    // Si no hay usuario, siempre redirigir a la página de autenticación
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Define los estados que permiten el acceso a rutas protegidas.
  const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trialing';

  if (hasActiveSubscription) {
    // Si el usuario tiene una suscripción activa o de prueba, permitir el acceso.
    return children;
  } else {
    // Para cualquier otro caso (past_due, canceled, unpaid, o sin suscripción),
    // redirigir a la página de "upgrade".
    // Se previene el bucle de redirección si ya se está en /upgrade.
    if (location.pathname !== '/upgrade') {
      return <Navigate to="/upgrade" replace />;
    }
    // Si ya está en /upgrade, permite que la página se renderice.
    return children;
  }
};

export default ProtectedRoute;
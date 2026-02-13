import { Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import SocialStorePage from './pages/SocialStorePage'; // Importar la nueva página
import RecoveryPage from './pages/RecoveryPage'; // Importar la nueva página de recuperación
import UpgradePage from './pages/UpgradePage'; // Importar el nuevo componente UpgradePage

import HomePage from './pages/HomePage'; // Importar la nueva Home

function App() {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/tienda/:storeId" element={<SocialStorePage />} />
      <Route path="/" element={<HomePage />} /> {/* Nueva ruta principal */}

      {/* Rutas Protegidas */}
      <Route path="/recovery" element={<ProtectedRoute><RecoveryPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/upgrade" element={<ProtectedRoute><UpgradePage /></ProtectedRoute>} /> {/* Nueva ruta para la página de upgrade */}
      
      {/* Redirección Antigua - Se puede eliminar o dejar por si acaso, por ahora la quito */}
      {/* <Route path="/" element={<Navigate to="/auth" replace />} /> */}
    </Routes>
  );
}

export default App;


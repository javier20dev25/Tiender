
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import SocialStorePage from './pages/SocialStorePage'; // Importar la nueva página
import RecoveryPage from './pages/RecoveryPage'; // Importar la nueva página de recuperación

function App() {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/tienda/:storeId" element={<SocialStorePage />} />

      {/* Rutas Protegidas */}
      <Route path="/recovery" element={<RecoveryPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      
      {/* Redirección Principal */}
      <Route path="/" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}

export default App;


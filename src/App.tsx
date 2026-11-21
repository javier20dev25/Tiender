import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy-loaded pages for code splitting
const AuthPage = lazy(() => import('./pages/AuthPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SocialStorePage = lazy(() => import('./pages/SocialStorePage'));
const RecoveryPage = lazy(() => import('./pages/RecoveryPage'));
const UpgradePage = lazy(() => import('./pages/UpgradePage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const CliDocsPage = lazy(() => import('./pages/CliDocsPage'));

import PageLoader from './components/PageLoader';

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Dominio por defecto: Entrada directa al Inicio de Sesión */}
        <Route path="/" element={<AuthPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Panel de Administrador Master */}
        <Route path="/admin" element={<AdminPage />} />

        {/* Rutas de Tiendas Sociales y Públicas */}
        <Route path="/s/:storeId" element={<SocialStorePage />} />
        <Route path="/tienda/:storeId" element={<SocialStorePage />} />
        <Route path="/terminos" element={<TermsPage />} />
        <Route path="/privacidad" element={<PrivacyPage />} />
        <Route path="/cli" element={<CliDocsPage />} />
        <Route path="/landing" element={<HomePage />} />

        {/* Rutas Protegidas */}
        <Route path="/recovery" element={<ProtectedRoute><RecoveryPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/upgrade" element={<ProtectedRoute><UpgradePage /></ProtectedRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;

import { Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';

// Placeholder for the main app dashboard after login
const Dashboard = () => (
  <div className="flex items-center justify-center min-h-screen">
    <h1 className="text-3xl font-bold">Dashboard</h1>
    <p>(Dashboard Content)</p>
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;

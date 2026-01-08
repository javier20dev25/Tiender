import { Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';

// Placeholder for the main app dashboard after login
const Dashboard = () => (
  <div className="flex items-center justify-center min-h-screen">
    <h1 className="text-3xl font-bold">Welcome to Tiender!</h1>
    <p>(Dashboard Content)</p>
  </div>
);

function App() {
  return (
    <Routes>
      {/* For now, the root will be the auth page. Later, we can add logic to redirect if logged in. */}
      <Route path="/" element={<AuthPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;

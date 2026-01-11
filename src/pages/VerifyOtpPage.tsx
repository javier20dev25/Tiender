
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const VerifyOtpPage: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get email from navigation state or prompt user
  const email = location.state?.email;

  if (!email) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 text-center bg-white rounded-lg shadow-md">
          <h1 className="text-xl font-bold text-red-600">Error</h1>
          <p className="mt-2 text-gray-700">No se proporcionó un correo electrónico. Por favor, intenta registrarte de nuevo.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) {
        throw error;
      }

      // On successful verification, Supabase sets the session
      // and the AuthProvider will redirect to the dashboard.
      // We can navigate to dashboard as a fallback.
      navigate('/dashboard');

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado al verificar el código.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900">Verificar Código</h1>
        <p className="text-center text-gray-600">
          Hemos enviado un código a <strong>{email}</strong>. Por favor, introdúcelo a continuación.
        </p>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
              Código de 6 dígitos
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-center tracking-[1em] text-gray-900 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {loading ? 'Verificando...' : 'Verificar y Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtpPage;

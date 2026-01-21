// src/pages/RecoveryPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface RecoveryPageProps {
  onSwitchToSignIn?: () => void;
}

const RecoveryPage: React.FC<RecoveryPageProps> = ({ onSwitchToSignIn }) => {
  const [whatsapp, setWhatsapp] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'enter_phone' | 'enter_code' | 'reset_password'>('enter_phone');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSwitchToSignIn = () => {
    if (onSwitchToSignIn) {
      onSwitchToSignIn();
    } else {
      navigate('/auth');
    }
  };
  
  const handleFindUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!whatsapp) {
      setErrorMessage('Por favor, introduce tu número de WhatsApp.');
      return;
    }
    // The verification function will handle if the user exists.
    // We just proceed to the next step.
    setStep('enter_code');
  };

  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      // Call the Supabase function to verify the code
      const { data, error } = await supabase.functions.invoke('verify-backup-code', {
        body: { phone: whatsapp, code: recoveryCode },
      });

      if (error) {
        throw new Error(error.message || 'Error al verificar el código.');
      }

      if (data.success) {
        // The user is verified. We can now proceed to the password reset step.
        // A full implementation would use the session/token returned from the function
        // to securely perform the password update.
        setStep('reset_password');
      } else {
        throw new Error(data.message || 'Código de recuperación inválido o expirado.');
      }

    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      // Placeholder for password reset logic.
      // In a real implementation, you would need a secure way to update the user's password.
      // This might involve a temporary token returned from the 'verify-backup-code' function.
      // For now, we simulate success and redirect to the login page.
      
      // Example of what could be here:
      // const { error } = await supabase.auth.updateUser({ password: newPassword });
      // if (error) throw error;
      
      alert("Contraseña restablecida (simulado). Serás redirigido al inicio de sesión.");
      navigate('/auth'); // Redirect to login page

    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900">Recuperación de Cuenta</h1>
        
        {step === 'enter_phone' && (
          <form onSubmit={handleFindUser}>
            <p className="text-gray-600 mb-4 text-center">Introduce tu número de WhatsApp para encontrar tu cuenta.</p>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+54 9 11 1234 5678"
              required
              className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button type="submit" disabled={loading} className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
              {loading ? 'Buscando...' : 'Continuar'}
            </button>
            {errorMessage && <p className="text-sm text-red-600 text-center mt-4">{errorMessage}</p>}
          </form>
        )}

        {step === 'enter_code' && (
          <form onSubmit={handleVerifyCode}>
            <p className="text-gray-600 mb-4 text-center">Introduce uno de tus códigos de recuperación.</p>
            <input
              type="text"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              placeholder="Ej: ABC123XYZ"
              required
              className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button type="submit" disabled={loading} className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
              {loading ? 'Verificando...' : 'Verificar Código'}
            </button>
            {errorMessage && <p className="text-sm text-red-600 text-center mt-4">{errorMessage}</p>}
          </form>
        )}

        {step === 'reset_password' && (
          <form onSubmit={handlePasswordReset}>
            <p className="text-gray-600 mb-4 text-center">Código verificado. Ahora puedes restablecer tu contraseña.</p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nueva Contraseña"
              required
              className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button type="submit" disabled={loading} className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
              {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
            </button>
            {errorMessage && <p className="text-sm text-red-600 text-center mt-4">{errorMessage}</p>}
          </form>
        )}
         <div className="mt-4 text-center">
            <button
              onClick={handleSwitchToSignIn}
              className="text-sm text-indigo-600 hover:text-indigo-500 underline"
              role="button"
            >
              Volver al inicio de sesión
            </button>
          </div>
      </div>
    </div>
  );
};

export default RecoveryPage;
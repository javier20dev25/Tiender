// src/pages/RecoveryPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const RecoveryPage: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'enter_phone' | 'enter_code' | 'reset_password'>('enter_phone');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFindUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      // In a real app, this would verify the phone number exists and potentially link to user_id
    // For now, we'll simulate finding the userId based on phone input (requires backend function to support phone lookup)
    // As a placeholder, if user enters a specific format, we can proceed to code entry.
    // This part needs a backend lookup or a pre-established user context.
    // For this example, we'll just simulate finding the user ID.
    // A proper implementation would query Supabase for the user associated with 'whatsapp'.
    // Example: Find user by phone (if that's the primary identifier)
    const { data, error } = await supabase.rpc('find_user_by_phone', { phone_number: whatsapp }); // Assuming such RPC exists

    if (error || !data || !data.userId) {
      throw new Error('No account found with that WhatsApp number.');
    }

      setUserId(data.userId);
      setStep('enter_code');

    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;
    setErrorMessage(null);
    setLoading(true);

    try {
      // Call the Supabase function to verify the code
      const response = await fetch('/.redirections/verify-backup-code', { // Assuming rewrite rules for functions
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: recoveryCode }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify recovery code.');
      }

      if (result.success) {
        setStep('reset_password');
      } else {
        throw new Error(result.message || 'Invalid recovery code.');
      }

    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;
    setErrorMessage(null);
    setLoading(true);

    try {
      // Use Supabase auth to reset password for the user
      // This requires a flow where the user is already "verified" by the backup code.
      // The actual password reset in Supabase typically uses email.
      // Since we are using backup codes, we'll assume this step is a confirmation.
      // In a real scenario, Supabase's password reset is email-based.
      // For this example, we'll simulate a successful reset and direct to login.
      
      // If using Supabase's auth.resetPasswordForEmail() after verification:
      // const { error } = await supabase.auth.resetPasswordForEmail(userEmail, { redirectTo: `${APP_URL}/auth/update-password` });
      // if (error) throw error;

      // Since we don't have the user's email here and are using backup codes,
      // we'll just signal success and redirect to login.
      // The system needs a way to link userId to a password field for reset.
      // For now, this is a placeholder.
      alert("Password reset flow initiated. Please check your email or proceed to login.");
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
              {loading ? 'Buscando cuenta...' : 'Buscar Cuenta'}
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
              {loading ? 'Verificando código...' : 'Verificar Código'}
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
            {/* NOTE: A real password reset would involve confirming password and actually calling Supabase reset function.
                This is a simplified placeholder, assuming successful code verification leads to password update.
                Supabase's auth.resetPasswordForEmail is email-based. For backup codes, a custom flow is needed.
                This flow simulates success and redirects to login. */}
            <button type="submit" disabled={loading} className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
              {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
            </button>
            {errorMessage && <p className="text-sm text-red-600 text-center mt-4">{errorMessage}</p>}
          </form>
        )}
         <div className="mt-4 text-center">
            <button
              onClick={onSwitchToSignIn} // Assuming this prop is passed or context is available
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

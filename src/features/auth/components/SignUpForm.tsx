import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient'; // Assuming supabase client is here
import { orchestrateSignUp, signIn } from '../services/authService';
import type { BusinessErrorCode } from '../services/authContracts';
import BackupCodesModal from './BackupCodesModal'; // Import the new modal
import html2canvas from 'html2canvas'; // Import html2canvas for image generation

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToSignIn }) => {
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [businessErrorCode, setBusinessErrorCode] = useState<BusinessErrorCode | null>(null);
  
  // State for backup codes modal
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);

  const navigate = useNavigate();

  const handleDownloadCodes = useCallback(async () => {
    const codesContainer = document.getElementById('recovery-codes-content');
    if (!codesContainer) {
      console.error("Recovery codes container not found.");
      alert("Error al generar la imagen. Intenta de nuevo.");
      return;
    }

    try {
      const canvas = await html2canvas(codesContainer);
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'tiender-recovery-codes.png';
      link.href = image;
      link.click();
      // Redirect to dashboard after download action is initiated
      navigate('/dashboard');
    } catch (error) {
      console.error("Error downloading codes:", error);
      alert("Error al descargar los códigos. Por favor, inténtalo de nuevo.");
    }
  }, [navigate]); // Added navigate dependency

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setBusinessErrorCode(null);
    setLoading(true);
    setIsLoadingCodes(true); // Start loading indicator for codes
    setIsModalOpen(true);    // Open modal to show loading state

    try {
      // Step 1: Create the user account using the phone number
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        phone: whatsapp, // Supabase allows phone number as primary identifier
        password: password,
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("User creation failed without error.");

      const userId = signUpData.user.id;

      // Step 2: Generate backup codes using the new Supabase function
      const response = await fetch('/.redirections/generate-backup-codes', { // Use the rewritten URL if applicable, or direct function URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to generate backup codes: ${errorData.error || response.statusText}`);
      }
      
      const { plain_codes } = await response.json();
      setBackupCodes(plain_codes);
      // Modal will be opened and handled by state change (isModalOpen)

      // Step 3: Automatically sign in the user after codes are generated and displayed
      // We might need to re-fetch the session or use signIn with the same credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        phone: whatsapp, // Using phone as the primary identifier as per current design
        password: password,
      });

      if (signInError) {
        console.error('Error detallado de Supabase al intentar iniciar sesión:', signInError);
        setErrorMessage('Tu cuenta fue creada, pero no pudimos iniciar sesión automáticamente. Por favor, intenta iniciar sesión manualmente con tu número y contraseña.');
        setBusinessErrorCode('MANUAL_SIGN_IN_REQUIRED'); 
        // Do NOT navigate to dashboard, leave modal open
        return;
      }

      // Step 4: Navigate to the dashboard ONLY after successful sign-in AND codes are ready to be shown
      // The modal's download action will handle the redirect.
      // We don't navigate here directly anymore, as the modal now controls the flow.

    } catch (err: unknown) {
      console.error("Sign up process failed:", err);
      const isBusinessError = (error: unknown): error is { isBusinessError: true; error_code: BusinessErrorCode; message: string } => {
        return (
          typeof error === 'object' &&
          error !== null &&
          'isBusinessError' in error &&
          (error as { isBusinessError: boolean }).isBusinessError === true
        );
      };

      if (isBusinessError(err)) {
        setBusinessErrorCode(err.error_code);
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      }
      else {
        setErrorMessage('Ocurrió un error inesperado. Por favor, intenta de nuevo.');
      }
      setIsLoadingCodes(false); // Stop loading if error occurs before codes are generated
      setIsModalOpen(false); // Close modal on error if it was opened
    } finally {
      setLoading(false);
      // setIsLoadingCodes(false); // Moved to specific error/success paths for better control
    }
  };
  
  const renderError = () => {
    if (!errorMessage) return null;

    switch (businessErrorCode) {
      case 'WHATSAPP_IN_USE':
      case 'EMAIL_EXISTS': // This case might be obsolete but kept for safety
      case 'PHONE_EXISTS':
      case 'MANUAL_SIGN_IN_REQUIRED':
        return (
          <p className="text-sm text-center text-red-600">
            {errorMessage.split('.')[0]}.
            <button
              type="button"
              onClick={onSwitchToSignIn}
              className="font-medium text-indigo-600 hover:text-indigo-500 underline ml-1"
            >
              Inicia Sesión
            </button>
          </p>
        );
      case 'WHATSAPP_BLOCKED':
        return <p className="text-sm text-red-600 text-center">{errorMessage}</p>;
      default:
        return <p className="text-sm text-red-600 text-center">{errorMessage}</p>;
    }
  }

  const isFormDisabled = businessErrorCode === 'WHATSAPP_BLOCKED' || loading || isLoadingCodes; // Disable form while processing codes

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center text-gray-900">Crear una cuenta</h1>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <fieldset disabled={isFormDisabled}>
          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">
              Número de WhatsApp
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              autoComplete="tel"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="+54 9 11 1234 5678"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          {renderError()}
          <div>
            <button
              type="submit"
              disabled={isFormDisabled}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {loading ? 'Creando...' : 'Crear Cuenta'}
            </button>
          </div>
        </fieldset>
      </form>
      
      {/* Backup Codes Modal */}
      {isModalOpen && backupCodes && (
        <BackupCodesModal 
          codes={backupCodes}
          storeName={store?.name || 'Tu Tienda'} // Fallback name
          onClose={() => setIsModalOpen(false)}
          onDownload={handleDownloadCodes} // Pass the download handler
        />
      )}
      {/* Loading indicator for codes generation might be needed inside modal or here */}
      {isLoadingCodes && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center">
            <p className="text-lg font-medium mb-4">Generando tus códigos de recuperación...</p>
            {/* Add a spinner or loader animation here if desired */}
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
          </div>
        </div>
      )}
    </div>
  );
};

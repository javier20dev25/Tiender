import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orchestrateSignUp, signIn } from '../services/authService';
import type { BusinessErrorCode } from '../services/authContracts';

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToSignIn }) => {
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [businessErrorCode, setBusinessErrorCode] = useState<BusinessErrorCode | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setBusinessErrorCode(null);
    setLoading(true);
    try {
      // Step 1: Create the user account using the phone number
      await orchestrateSignUp({ phone: whatsapp, password });

      // Step 2: Automatically sign in the user with the same phone number
      const { error: signInError } = await signIn({ phone: whatsapp, password });

      if (signInError) {
        setErrorMessage('Tu cuenta fue creada, pero no pudimos iniciar sesión. Por favor, intenta iniciar sesión manualmente.');
        setBusinessErrorCode('MANUAL_SIGN_IN_REQUIRED'); // This is now a critical failure indicator
        return;
      }

      // Step 3: Navigate to the dashboard on successful sign-in
      navigate('/dashboard');

    } catch (err: unknown) {
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
    } finally {
      setLoading(false);
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

  const isFormDisabled = businessErrorCode === 'WHATSAPP_BLOCKED';

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
              disabled={loading || isFormDisabled}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {loading ? 'Verificando...' : 'Crear Cuenta'}
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
};
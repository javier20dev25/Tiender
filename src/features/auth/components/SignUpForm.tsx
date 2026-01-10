import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orchestrateSignUp } from '../services/authService';
import type { BusinessErrorCode } from '../services/authContracts';

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToSignIn }) => {
  const [email, setEmail] = useState('');
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
      await orchestrateSignUp({ email, password, whatsapp });
      navigate('/verify-otp', { state: { email } });
    } catch (err: any) {
      if (err && err.isBusinessError) {
        setBusinessErrorCode(err.error_code);
        setErrorMessage(err.message);
      } else {
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
      case 'EMAIL_EXISTS':
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
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo Electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
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
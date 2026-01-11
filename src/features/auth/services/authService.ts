// src/features/auth/services/authService.ts
import { supabase } from '../../../lib/supabaseClient';
import type { SignUpWithPasswordCredentials } from '@supabase/supabase-js';
import type {
  OrchestrationSignUpRequest,
  OrchestrationSignUpResponse,
} from './authContracts';

// --- MOCK DATABASE (para entorno de desarrollo/test) ---
export const mockWhatsappDB: { whatsapp_number: string; status: 'TRIAL_ACTIVE' | 'BLOCKED' }[] = [];
export const mockEmailDB: string[] = [];
export const resetMockDB = () => {
  mockWhatsappDB.length = 0;
  mockEmailDB.length = 0;
};

// --- IMPLEMENTACIÓN DEL SERVICIO SIMULADO ---
const mockOrchestrateSignUp = (
  credentials: OrchestrationSignUpRequest
): Promise<OrchestrationSignUpResponse> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const normalizedWhatsApp = credentials.whatsapp.replace(/\D/g, '');

      if (credentials.whatsapp.includes('blocked')) {
        return reject({
          isBusinessError: true,
          error_code: 'WHATSAPP_BLOCKED',
          message: 'Esta cuenta se encuentra bloqueada.'
        });
      }
      if (credentials.email.includes('email_exists')) {
        return reject({
          isBusinessError: true,
          error_code: 'EMAIL_EXISTS',
          message: 'Este correo electrónico ya está en uso. Por favor, inicia sesión.'
        });
      }
      const existingIdentity = mockWhatsappDB.find(identity => identity.whatsapp_number === normalizedWhatsApp);
      if (existingIdentity) {
        return reject({
          isBusinessError: true,
          error_code: 'WHATSAPP_IN_USE',
          message: 'Este número de WhatsApp ya está registrado. ¿Olvidaste tu contraseña?'
        });
      }

      mockWhatsappDB.push({ whatsapp_number: normalizedWhatsApp, status: 'TRIAL_ACTIVE' });
      mockEmailDB.push(credentials.email);

      resolve({ success: true, message: '(Mock) Usuario registrado. Por favor, verifica tu OTP.' });
    }, 500);
  });
};

// --- IMPLEMENTACIÓN DEL SERVICIO DE PRODUCCIÓN ---
const productionOrchestrateSignUp = async (
  credentials: OrchestrationSignUpRequest
): Promise<OrchestrationSignUpResponse> => {
  const { data, error } = await supabase.functions.invoke('orchestrate-signup', {
    body: credentials,
  });

  if (error) {
    const errorContext = (error as { context: Response }).context;
    if (errorContext && typeof errorContext.json === 'function') {
      const errorJson = await errorContext.json();
      // Lanza objeto plain para frontend
      throw {
        isBusinessError: true,
        ...errorJson
      };
    }
    throw error; // Error de red/sistema
  }

  return data as OrchestrationSignUpResponse;
};


// --- FUNCIONES EXPUESTAS ---
export const orchestrateSignUp = import.meta.env.DEV ? mockOrchestrateSignUp : productionOrchestrateSignUp;

export const signIn = async (credentials: SignUpWithPasswordCredentials) => {
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  return { user: data.user, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const signUp = async (credentials: SignUpWithPasswordCredentials) => {
    const { data, error } = await supabase.auth.signUp(credentials);
    return { user: data.user, error };
};
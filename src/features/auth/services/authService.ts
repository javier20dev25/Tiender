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
      // Use credentials.phone instead of credentials.whatsapp
      const normalizedPhone = credentials.phone.replace(/\D/g, '');

      if (credentials.phone.includes('blocked')) {
        return reject({
          isBusinessError: true,
          error_code: 'WHATSAPP_BLOCKED',
          message: 'Esta cuenta se encuentra bloqueada.'
        });
      }
      
      const existingIdentity = mockWhatsappDB.find(identity => identity.whatsapp_number === normalizedPhone);
      if (existingIdentity) {
        return reject({
          isBusinessError: true,
          error_code: 'WHATSAPP_IN_USE',
          message: 'Este número de WhatsApp ya está registrado. ¿Olvidaste tu contraseña?'
        });
      }

      mockWhatsappDB.push({ whatsapp_number: normalizedPhone, status: 'TRIAL_ACTIVE' });
      // mockEmailDB is no longer relevant

      resolve({ success: true, message: '(Mock) Usuario registrado.' });
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
export const orchestrateSignUp = productionOrchestrateSignUp;

export const signIn = async (credentials: { phone: string; password: string }) => {
  // The phone number must be normalized (digits only) and then converted
  // to the derived email format to match the user identity created in the backend.
  const normalizedPhone = credentials.phone.replace(/\D/g, '');
  const email = `${normalizedPhone}@tiender.app`;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: credentials.password,
  });
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
// src/lib/__mocks__/supabaseClient.ts
import { vi } from 'vitest';

// Este es el mock centralizado para el cliente de Supabase.
// Vitest lo usará automáticamente en todos los archivos de prueba
// que llamen a vi.mock('../lib/supabaseClient').

const from = vi.fn(() => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  // single() es una función clave que faltaba en los mocks inconsistentes.
  // La hacemos una función mock que puede devolver una promesa.
  single: vi.fn(() => Promise.resolve({ data: null, error: null })),
}));

const supabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    admin: {
        deleteUser: vi.fn(),
    }
  },
  functions: {
    invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
  },
  rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  from,
};

export { supabase };

// src/lib/__mocks__/supabaseClient.ts
import { vi } from 'vitest';

// This is the manual mock for the supabase client.
// Vitest will automatically use this file whenever vi.mock('src/lib/supabaseClient') is called.

const mockAuth = {
  getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  onAuthStateChange: vi.fn((_event, callback) => {
    if (callback) {
      callback('INITIAL_SESSION', null);
    }
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  }),
  signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'new-user' }, session: {} }, error: null }),
  signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: 'mock-user' }, session: {} }, error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
};

const mockSupabase = {
  auth: mockAuth,
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    // Mock thenable for promise-like behavior
    then: (onfulfilled: any) => onfulfilled({ data: [], error: null }),
  })),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  functions: {
    invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
};

export const supabase = mockSupabase;
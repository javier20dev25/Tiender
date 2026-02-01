// src/__mocks__/supabase.ts
import { vi } from 'vitest';

// --- Mock Data ---
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

const mockSession = {
  access_token: 'fake-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'fake-refresh-token',
  user: mockUser,
};

const mockStoreStandard = {
  id: 'store-456',
  user_id: 'user-123',
  name: 'Mi Tienda',
  plan_type: 'standard',
  product_limit: 10,
};

const mockProducts = [
  { id: 'prod-1', title: 'Producto 1', price: 100, image_url: 'url1' },
  { id: 'prod-2', title: 'Producto 2', price: 200, image_url: 'url2' },
];

const mockAnalytics = {
  total_views: 1500,
  total_likes: 300,
  total_add_to_cart: 50,
  total_sales: 25,
  conversion_rate: 0.016,
};

// --- Mock Client ---
// This is a more robust, chainable mock
const fromImplementation = (tableName: string) => {
  const query: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(), // Not returning this, will be the final call
  };

  let promise;

  if (tableName === 'stores') {
    query.single.mockResolvedValue({ data: mockStoreStandard, error: null });
    promise = Promise.resolve({ data: [mockStoreStandard], error: null });
  } else if (tableName === 'products') {
    promise = Promise.resolve({ data: mockProducts, error: null });
  } else {
    // Default for any other table
    promise = Promise.resolve({ data: [], error: null });
  }
  
  // Make the query object thenable to simulate awaiting a query
  query.then = (onfulfilled: any, onrejected: any) => promise.then(onfulfilled, onrejected);
  
  return query;
};

export const mockSupabase = {
  auth: {
    signUp: vi.fn().mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    }),
    onAuthStateChange: vi.fn((_event, callback) => {
      // Immediately call the callback with a mock session
      if (callback) {
        callback('INITIAL_SESSION', mockSession);
      }
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      };
    }),
    getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
  from: vi.fn(fromImplementation),
  rpc: vi.fn((fnName) => {
    if (fnName === 'get_store_analytics') {
      return Promise.resolve({ data: mockAnalytics, error: null });
    }
    return Promise.resolve({ data: null, error: new Error(`RPC function '${fnName}' not mocked`) });
  }),
  functions: {
    invoke: vi.fn().mockResolvedValue({
      data: { approve_url: 'https://sandbox.paypal.com/approve/fake-url' },
      error: null,
    }),
  },
};

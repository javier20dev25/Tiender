// src/setupTests.ts
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// --- Global Supabase Mock ---
vi.mock('./lib/supabaseClient', () => {
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
    trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    whatsapp_number: '1234567890',
  };

  const mockProducts = [
    { id: 'prod-1', title: 'Producto 1', price: 100, image_url: 'url1', external_links: [] },
    { id: 'prod-2', title: 'Producto 2', price: 200, image_url: 'url2', external_links: [] },
  ];

  // --- Mock Client ---
  const fromImplementation = (tableName: string) => {
    const query = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: [{}], error: null }),
      update: vi.fn().mockResolvedValue({ data: [{}], error: null }),
      upsert: vi.fn().mockResolvedValue({ data: [{}], error: null }),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      range: vi.fn().mockReturnThis(),
      csv: vi.fn().mockReturnThis(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let promise: Promise<{ data: any; error: any }>;

    if (tableName === 'stores') {
      query.single.mockResolvedValue({ data: mockStoreStandard, error: null });
      query.maybeSingle.mockResolvedValue({ data: mockStoreStandard, error: null });
      promise = Promise.resolve({ data: [mockStoreStandard], error: null });
    } else if (tableName === 'products') {
      query.eq.mockImplementation((column, value) => {
        if (column === 'id') {
          const product = mockProducts.find(p => p.id === value);
          query.single.mockResolvedValue({ data: product, error: null });
          promise = Promise.resolve({ data: product ? [product] : [], error: null });
        }
        return query;
      });
      promise = Promise.resolve({ data: mockProducts, error: null });
    } else if (tableName === 'subscriptions') {
      const mockSubscription = { status: 'active', current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() };
      query.single.mockResolvedValue({ data: mockSubscription, error: null });
      query.maybeSingle.mockResolvedValue({ data: mockSubscription, error: null });
      promise = Promise.resolve({ data: [mockSubscription], error: null });
    } else {
      query.single.mockResolvedValue({ data: null, error: null });
      query.maybeSingle.mockResolvedValue({ data: null, error: null });
      promise = Promise.resolve({ data: [], error: null });
    }

    // Make the query object thenable to simulate awaiting a query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (query as any).then = (onfulfilled: (value: any) => any, onrejected: (reason: any) => any) => promise.then(onfulfilled, onrejected);

    return query;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const rpcImplementation = (fnName: string, _params: unknown) => {
    if (fnName === 'get_weekly_heatmap_analytics') {
      return Promise.resolve({
        data: {
          heatmap_data: [],
          product_summary: [],
          total_summary: { total_visits: 0, total_adds_to_cart: 0 },
        },
        error: null,
      });
    }
    if (fnName === 'get_store_products') {
      return Promise.resolve({ data: mockProducts, error: null });
    }
    if (fnName === 'log_product_event') {
      return Promise.resolve({ data: {}, error: null });
    }
    return Promise.resolve({ data: null, error: new Error(`RPC function '${fnName}' not mocked`) });
  }

  const functionsImplementation = (fnName: string, options: { body?: { planId?: string } } = {}) => {
    const { body = {} } = options;
    if (fnName === 'create-paypal-subscription') {
      if (body.planId === 'invalid-plan') {
        return Promise.resolve({ error: { message: 'Error de PayPal: Invalid plan' } });
      }
      return Promise.resolve({
        data: { approve_url: 'https://sandbox.paypal.com/approve/fake-url' },
        error: null,
      });
    }
    return Promise.resolve({ data: {}, error: null });
  }

  const mockSupabaseClient = {
    auth: {
      signUp: vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      }),
      onAuthStateChange: vi.fn((callback) => {
        if (typeof callback === 'function') {
          callback('SIGNED_IN', mockSession);
        }
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn(fromImplementation),
    rpc: vi.fn(rpcImplementation),
    functions: {
      invoke: vi.fn(functionsImplementation),
    },
  };

  return {
    getSupabase: vi.fn(() => mockSupabaseClient),
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

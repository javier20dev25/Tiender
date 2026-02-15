// src/e2e/suscripcion-flow.test.tsx
// Test E2E para el flujo de suscripción en el Dashboard.
// Verifica: upgrade de plan, redirect a PayPal, y manejo de errores.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';

// --- Mock Data ---
const mockUser = { id: 'user-123', email: 'test@example.com' };
const initialStore = {
  id: 'store-456',
  user_id: 'user-123',
  name: 'Mi Tienda',
  plan_type: 'standard',
  product_limit: 10,
  trial_ends_at: null,
  whatsapp_number: '+1234567890',
  logo_url: null,
};

// --- Mock Supabase ---
const mockFrom = vi.fn();
const mockFunctionsInvoke = vi.fn();
const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });

vi.mock('../lib/supabaseClient', () => ({
  getSupabase: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn(),
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    },
    from: mockFrom,
    functions: { invoke: mockFunctionsInvoke },
    rpc: mockRpc,
    storage: { from: vi.fn().mockReturnValue({ remove: vi.fn().mockResolvedValue({ error: null }) }) },
  })),
}));

// Mock useAuth to provide store and subscription data directly
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../context/AuthContext';
const mockUseAuth = useAuth as vi.Mock;

// Mock window.location.href
let mockLocationHref = '';
const originalLocation = window.location;

beforeEach(() => {
  vi.clearAllMocks();

  // Default: user with standard plan, active subscription
  mockUseAuth.mockReturnValue({
    user: mockUser,
    store: initialStore,
    subscription: { status: 'active', current_period_end: null },
    loading: false,
    signOut: vi.fn(),
  });

  // Default from() mock
  mockFrom.mockImplementation((tableName: string) => {
    const chain: any = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockResolvedValue({ data: [], error: null });
    chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
    chain.insert = vi.fn().mockResolvedValue({ data: [], error: null });
    chain.update = vi.fn().mockReturnValue(chain);
    chain.delete = vi.fn().mockReturnValue(chain);
    return chain;
  });

  // Default invoke mock (PayPal approval URL)
  mockFunctionsInvoke.mockResolvedValue({
    data: { approve_url: 'https://sandbox.paypal.com/approve/fake-url' },
    error: null,
  });

  // Mock window.location.href setter
  delete (window as any).location;
  window.location = { ...originalLocation, href: '' } as any;
  Object.defineProperty(window.location, 'href', {
    get: () => mockLocationHref,
    set: (value: string) => { mockLocationHref = value; },
    configurable: true,
  });
});

afterEach(() => {
  window.location = originalLocation;
  mockLocationHref = '';
});

describe('Flujo de Suscripción E2E en Dashboard', () => {
  it('debería mejorar el plan y reflejar el cambio en la UI', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    // Wait for dashboard to render with the store name
    await waitFor(() => {
      expect(screen.getByText('Panel del Vendedor')).toBeInTheDocument();
    });

    // Find and click the upgrade button
    const upgradeButton = screen.getByRole('button', { name: /mejorar plan/i });
    fireEvent.click(upgradeButton);

    // Verify invoke was called with correct arguments
    await waitFor(() => {
      expect(mockFunctionsInvoke).toHaveBeenCalledWith(
        'create-paypal-subscription',
        expect.objectContaining({ body: expect.objectContaining({ planType: 'full' }) })
      );
    });

    // Verify redirect to PayPal
    expect(window.location.href).toBe('https://sandbox.paypal.com/approve/fake-url');

    // --- Simulate webhook callback: Plan upgraded ---
    const upgradedStore = { ...initialStore, plan_type: 'full', trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() };
    mockUseAuth.mockReturnValue({
      user: mockUser,
      store: upgradedStore,
      subscription: { status: 'active', current_period_end: null },
      loading: false,
      signOut: vi.fn(),
    });

    // Re-render (cleanup first to avoid duplicate DOM elements)
    cleanup();
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Panel del Vendedor')).toBeInTheDocument();
    });

    // The upgrade button should no longer be visible for 'full' plan
    expect(screen.queryByRole('button', { name: /mejorar plan/i })).not.toBeInTheDocument();
  });

  it('debería manejar error en create-paypal-subscription y mostrar alerta', async () => {
    mockFunctionsInvoke.mockResolvedValueOnce({
      data: null,
      error: new Error('Error de PayPal: Invalid plan'),
    });

    // Spy on window.alert
    vi.spyOn(window, 'alert').mockImplementation(() => { });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Panel del Vendedor')).toBeInTheDocument();
    });

    const upgradeButton = screen.getByRole('button', { name: /mejorar plan/i });
    fireEvent.click(upgradeButton);

    // Verify error message appears in the UI (DashboardPage uses setError, not window.alert)
    await waitFor(() => {
      expect(screen.getByText(/no se pudo iniciar la mejora de plan/i)).toBeInTheDocument();
    });

    // No redirect should happen
    expect(window.location.href).toBe('');
  });
});
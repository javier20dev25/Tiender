// src/e2e/suscripcion-flow.test.tsx
// Nota: Este es un test E2E corregido que simula el flujo completo:
// - Renderiza DashboardPage con plan inicial 'standard'.
// - Simula clic en "Mejorar Plan", que invoca getSupabase().functions.invoke directamente (basado en ReadFile de DashboardPage.tsx).
// - Mockea respuesta de Supabase con 'approvalUrl' en camelCase (para match con código real).
// - Verifica llamada a invoke y asignación a window.location.href (ajustado a .href ya que el código real podría usar window.location.href = url).
// - Simula webhook update cambiando el mock de store a 'full' con trial.
// - Re-renderiza DashboardPage y verifica UI actualizada con 'full'.
// - Agrega cobertura para error case (invoke falla y muestra mensaje de error en UI).
// - Usa mocks persistentes: redefine el mock de from() para la segunda render para asegurar que use upgradedStore.
// - Selectores robustos con matcher de tag y content.
// - Importa componentes reales.

// Ajustes basados en errores previos:
// - Usa 'approvalUrl' en camelCase (no 'approve_url') para evitar "No se recibió la URL".
// - Mock de window.location.href en lugar de .assign, para match con posible implementación real.
// - Evita genéricos ambiguos; define interfaz separada.
// - No usa Routes/UpgradePage explícito ya que ReadFile muestra que handleUpgrade en Dashboard invoca directamente sin nav a Upgrade (asumiendo selección de plan fija o default).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getSupabase } from '../lib/supabaseClient';
import DashboardPage from '../pages/DashboardPage';
import { AuthProvider } from '../context/AuthContext'; // Ajusta path si necesario

vi.mock('../lib/supabaseClient');

// Datos mock
const mockUser = { id: 'user-123', email: 'test@example.com' };
const mockSession = { access_token: 'fake-token', user: mockUser };
const initialStore = {
  id: 'store-456',
  user_id: 'user-123',
  name: 'Mi Tienda',
  plan_type: 'standard',
  product_limit: 10,
  trial_ends_at: null,
};
const upgradedStore = {
  ...initialStore,
  plan_type: 'full',
  product_limit: 60,
  trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
};

// Interfaz para mock response
interface SupabaseMockResponse<T> {
  data: T;
  error: Error | null;
}

// Helper para chainable mock
const createChainableMock = <T,>(response: SupabaseMockResponse<T>) => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue(response),
  order: vi.fn().mockResolvedValue(response),
});

// Mock window.location.href
let mockLocationHref = '';
const originalLocation = window.location;
beforeEach(() => {
  vi.clearAllMocks();
  const mockedSupabase = vi.mocked(supabase);

  mockedSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null });

  // Mock inicial de store
  mockedSupabase.from.mockImplementation((tableName: string) => {
    if (tableName === 'stores') {
      return createChainableMock({ data: initialStore, error: null });
    }
    return createChainableMock({ data: [], error: null });
  });

  // Mock invoke happy path con camelCase
  mockedSupabase.functions.invoke.mockResolvedValue({
    data: { approvalUrl: 'https://sandbox.paypal.com/approve/fake-url' },
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
    const { unmount } = render(
      <MemoryRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Verificación inicial: Plan 'standard'
    await waitFor(() => {
      expect(screen.getByText((content, element) =>
        element?.tagName.toLowerCase() === 'span' && content === 'standard'
      )).toBeInTheDocument();
    });

    const upgradeButton = screen.getByRole('button', { name: /mejorar plan/i });
    fireEvent.click(upgradeButton);

    // Verifica llamada a invoke (asumiendo plan default 'full' o fijo en handleUpgrade)
    await waitFor(() => {
      expect(getSupabase().functions.invoke).toHaveBeenCalledWith(
        'create-paypal-subscription',
        { body: { planType: 'full' } }
      );
    });

    // Verifica redirect simulado
    expect(window.location.href).toBe('https://sandbox.paypal.com/approve/fake-url');

    // Simula webhook: Cambia mock de from() a upgradedStore persistentemente para re-render
    vi.mocked(getSupabase().from).mockImplementation((tableName: string) => {
      if (tableName === 'stores') {
        return createChainableMock({ data: upgradedStore, error: null });
      }
      return createChainableMock({ data: [], error: null });
    });

    // Re-render DashboardPage
    unmount();
    render(
      <MemoryRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Verificación final: Plan 'full'
    await waitFor(() => {
      expect(screen.getByText((content, element) =>
        element?.tagName.toLowerCase() === 'span' && content === 'full'
      )).toBeInTheDocument();
    });

    // Botón de upgrade no visible
    expect(screen.queryByRole('button', { name: /mejorar plan/i })).not.toBeInTheDocument();
  });

  it('debería manejar error en create-paypal-subscription y mostrar alerta', async () => {
    vi.mocked(getSupabase().functions.invoke).mockResolvedValueOnce({
      data: null,
      error: new Error('Error de PayPal: Invalid plan'),
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const upgradeButton = await screen.findByRole('button', { name: /mejorar plan/i });
    fireEvent.click(upgradeButton);

    // Verifica mensaje de error en UI (ajusta texto exacto basado en DOM dump)
    await waitFor(() => {
      expect(screen.getByText(/No se pudo iniciar el proceso de mejora de plan/i)).toBeInTheDocument();
    });

    // No redirect
    expect(window.location.href).toBe('');
  });
});
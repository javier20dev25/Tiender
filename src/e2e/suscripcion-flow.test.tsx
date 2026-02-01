import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';
import DashboardPage from '../pages/DashboardPage';
import { supabase } from '../lib/supabaseClient';
import { MemoryRouter } from 'react-router-dom';

// Use the centralized mock
vi.mock('../lib/supabaseClient');

describe('Flujo de Suscripción E2E', () => {

  // --- Reusable Mock Data ---
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockSession = { access_token: 'fake-token', user: mockUser };
  const initialStore = { 
    id: 'store-456', 
    user_id: 'user-123', 
    name: 'Mi Tienda', 
    plan_type: 'standard', 
    product_limit: 10 
  };
  const upgradedStore = { ...initialStore, plan_type: 'full', product_limit: 100 };

  // --- Fully Chainable Mock Builder ---
  interface SupabaseMockResponse<T> {
    data: T;
    error: Error | null;
  }

  const createChainableMock = <T>(dataToResolve: SupabaseMockResponse<T>) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue(dataToResolve), // Resolves the final chain
      single: vi.fn().mockResolvedValue(dataToResolve), // Resolves the final chain
  });

  beforeEach(() => {
    vi.clearAllMocks();
    const mockedSupabase = vi.mocked(supabase);

    // --- Mock Auth & Functions ---
    mockedSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null });
    mockedSupabase.functions.invoke.mockResolvedValue({
      data: { approve_url: 'https://sandbox.paypal.com/approve/fake-url' },
      error: null,
    });
    
    // --- Initial DB State Mock ---
    // This mock will now be simpler and only represent the initial state.
    mockedSupabase.from.mockImplementation((tableName: string) => {
      if (tableName === 'stores') {
        return createChainableMock({ data: initialStore, error: null });
      }
      if (tableName === 'products') {
        return createChainableMock({ data: [], error: null });
      }
      return createChainableMock({ data: [], error: null });
    });
  });

      it.skip('debería permitir a un usuario mejorar su plan y reflejar el cambio en la UI', async () => {

        // Initial Render

        const { unmount } = render(

          <MemoryRouter>

            <AuthProvider>

              <DashboardPage />

            </AuthProvider>

          </MemoryRouter>

        );

    

        // 1. VERIFICACIÓN INICIAL: El usuario ve el plan 'standard'

        await waitFor(() => {

          expect(screen.getByText(/Plan Actual: standard/i)).toBeInTheDocument();

        });

        const upgradeButton = screen.getByRole('button', { name: /mejorar plan/i });

        expect(upgradeButton).toBeInTheDocument();

    

        // 2. ACCIÓN: El usuario hace clic en mejorar plan

        fireEvent.click(upgradeButton);

        await waitFor(() => {

          expect(supabase.functions.invoke).toHaveBeenCalledWith('create-paypal-subscription');

        });

    

        // 3. SIMULACIÓN DEL WEBHOOK: 

        // We explicitly mock the *next* call to `from('stores')` to return the upgraded plan.

        vi.mocked(supabase.from).mockImplementationOnce((tableName: string) => {

            if (tableName === 'stores') {

                return createChainableMock({ data: upgradedStore, error: null });

            }

            return createChainableMock({ data: [], error: null });

        });

    

        // 4. TRIGGER RE-FETCH: Explicitly unmount and then re-render the component.

        unmount();

        render(

          <MemoryRouter>

            <AuthProvider>

              <DashboardPage />

            </AuthProvider>

          </MemoryRouter>

        );

    

        // 5. VERIFICACIÓN FINAL: El plan del usuario ahora es 'full'

        await waitFor(() => {

          expect(screen.getByText(/Plan Actual: full/i)).toBeInTheDocument();

        });

        expect(screen.queryByRole('button', { name: /mejorar plan/i })).not.toBeInTheDocument();

      });});

// src/test-utils.tsx
import { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { vi, type Mock } from 'vitest';
import { supabase } from './lib/supabaseClient';

vi.mock('./lib/supabaseClient');

// --- Standard Mocks ---
const mockUser = { id: 'test-user-id', email: 'test@tiender.com' };
const mockSession = { user: mockUser, access_token: 'test-token' };
const mockStore = { id: 'store-123', name: 'Tienda de Prueba', user_id: mockUser.id, plan_type: 'standard' };

/**
 * A custom render function that wraps components in necessary providers
 * for testing. It pre-mocks a logged-in user with a store.
 */
const renderWithProviders = (
  ui: ReactElement,
  {
    route = '/',
    ...renderOptions
  }: { route?: string } & Omit<RenderOptions, 'wrapper'> = {}
) => {
  // --- Reset mocks for every render ---
  vi.clearAllMocks();
  const mockedSupabase = vi.mocked(supabase);

  // Mock a successful, authenticated session
  (mockedSupabase.auth.getSession as Mock).mockResolvedValue({ data: { session: mockSession }, error: null });
  (mockedSupabase.auth.onAuthStateChange as Mock).mockImplementation((callback) => {
    callback('SIGNED_IN', mockSession);
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });

  // Mock the database call within AuthContext to get the store
  (mockedSupabase.from as Mock).mockImplementation((tableName: string) => {
    if (tableName === 'stores') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockStore, error: null }),
      } as any;
    }
    // Provide a default fallback for other tables
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    } as any;
  });

  // Mock RPC and Functions calls
  (mockedSupabase.rpc as Mock).mockResolvedValue({ data: {}, error: null });
  (mockedSupabase.functions.invoke as Mock).mockResolvedValue({ data: {}, error: null });


  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
    renderOptions
  );
};

// Re-export everything from testing-library
export * from '@testing-library/react';
// Override the render method with our custom one
export { renderWithProviders as render };

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import App from '../App';
import { supabase } from '../lib/supabaseClient';

// Use the centralized mock
vi.mock('../lib/supabaseClient');

// Define types for mock clarity
type AuthChangeEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'INITIAL_SESSION';
type Session = { user: { id: string; email: string; } | null; access_token: string; } | null;

const generateRandomEmail = () => `test.user.${Math.random().toString(36).substring(2, 10)}@tiender.com`;

describe('Full E2E User and Customer Flow', () => {
    
    const testUser = {
        email: generateRandomEmail(),
        password: 'Password123!',
        storeName: 'Tienda de Prueba E2E',
    };
    const mockSupabaseUser = { id: 'test-user-id', email: testUser.email };
    const mockSession = { user: mockSupabaseUser, access_token: 'test-token' };

    beforeEach(() => {
        vi.clearAllMocks();
        const mockedSupabase = vi.mocked(supabase);

        // --- Mock Auth Flow ---
        mockedSupabase.auth.signUp.mockResolvedValue({
            data: { user: mockSupabaseUser, session: mockSession },
            error: null,
        });

        // This is crucial for the app to recognize the user is logged in
        mockedSupabase.auth.onAuthStateChange.mockImplementation((callback: (event: AuthChangeEvent, session: Session) => void) => {
            // Simulate immediate sign-in upon subscription
            act(() => {
                callback('SIGNED_IN', mockSession);
            });
            return { data: { subscription: { unsubscribe: vi.fn() } } };
        });

        mockedSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null });

        // --- Mock DB Flow ---
        mockedSupabase.from.mockImplementation((tableName: string) => {
            if (tableName === 'stores') {
                return {
                    select: vi.fn().mockReturnThis(),
                    insert: vi.fn().mockResolvedValue({ error: null, data: [{ id: 'new-store-id', name: testUser.storeName }] }),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ error: null, data: { id: 'new-store-id', name: testUser.storeName, plan_type: 'standard' } }),
                } as any;
            }
            if (tableName === 'products') {
                return {
                    select: vi.fn().mockReturnThis(),
                    insert: vi.fn().mockResolvedValue({ error: null, data: [{ id: 'new-product-id', title: 'Test Product', price: 10 }] }),
                    eq: vi.fn().mockReturnThis(),
                    order: vi.fn().mockResolvedValue({ error: null, data: [{ id: 'new-product-id', title: 'Test Product', price: 10 }] }),
                } as any;
            }
            // Default for other tables
            return {
                select: vi.fn().mockResolvedValue({ error: null, data: [] }),
            } as any;
        });

        // --- Mock Functions Flow ---
        mockedSupabase.functions.invoke.mockImplementation(async (functionName) => {
            if (functionName === 'generate-backup-codes') {
                return { data: { plain_codes: ['code1', 'code2', 'code3'] }, error: null };
            }
            if (functionName === 'get_store_analytics') {
                return { data: { total_views: 0, total_likes: 0, total_add_to_cart: 0, total_sales: 0, conversion_rate: 0 }, error: null };
            }
            return { data: null, error: null };
        });
    });

    it('should run the full flow from sign-up to product creation', async () => {
    await act(async () => {
      render(
          <MemoryRouter initialEntries={['/auth']}>
              <AuthProvider>
                  <App />
              </AuthProvider>
          </MemoryRouter>
      );
    });

    // 1. --- Sign Up Flow ---
    // The App starts at AuthPage, which defaults to SignUpForm with WhatsApp
    // Click to switch to email form
    fireEvent.click(screen.getByText(/o usa tu correo electrónico/i));

    // Now find and fill the email form
    await waitFor(() => expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: testUser.email } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: testUser.password } });
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    // After sign-up, a backup codes modal appears. The user must close it.
    const confirmButton = await screen.findByRole('button', { name: /he guardado mis códigos/i });
    fireEvent.click(confirmButton);
    
    // 2. --- Store Creation / Dashboard Flow ---
    // After closing the modal, user is on the dashboard.
    await waitFor(() => {
        expect(screen.getByText(`Tu Tienda: ${testUser.storeName}`)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // 3. --- Product Creation Flow ---
    fireEvent.click(screen.getByRole('button', { name: /\+ añadir producto/i }));
    
    await waitFor(() => expect(screen.getByText(/añadir nuevo producto/i)).toBeInTheDocument());
    
    fireEvent.change(screen.getByLabelText(/nombre del producto/i), { target: { value: 'Test Product' } });
    fireEvent.change(screen.getByLabelText(/precio \(usd\)/i), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Añadir Producto' }));
    
    // Wait for product to appear on dashboard
    await waitFor(() => expect(screen.getByText('Test Product')).toBeInTheDocument());
  });
});

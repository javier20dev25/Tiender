// src/e2e/full-flow.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import App from '../App';
import { supabase } from '../lib/supabaseClient';

vi.mock('../lib/supabaseClient');

const generateRandomEmail = () => `test.user.${Math.random().toString(36).substring(2, 10)}@tiender.com`;

describe('Full E2E User and Customer Flow', () => {
    
    const testUser = {
        email: generateRandomEmail(),
        password: 'Password123!',
        storeName: 'Tienda de Prueba E2E',
    };
    const mockSupabaseUser = { id: 'test-user-id', email: testUser.email };
    const mockSession = { user: mockSupabaseUser, access_token: 'test-token' };
    const mockNewStore = { id: 'new-store-id', name: testUser.storeName, user_id: mockSupabaseUser.id, plan_type: 'standard' };

    beforeEach(() => {
        vi.clearAllMocks();
        const mockedSupabase = vi.mocked(supabase);

        // --- Mock Auth Flow ---
        mockedSupabase.auth.signUp.mockResolvedValue({
            data: { user: mockSupabaseUser, session: mockSession },
            error: null,
        });
        mockedSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null });
        mockedSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
            callback('SIGNED_IN', mockSession);
            return { data: { subscription: { unsubscribe: vi.fn() } } };
        });

        // --- Mock DB Flow ---
        mockedSupabase.from.mockImplementation(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ error: null, data: mockNewStore }),
            order: vi.fn().mockResolvedValue({ error: null, data: [{ id: 'new-product-id', title: 'Test Product', price: 10 }] }),
            insert: vi.fn().mockResolvedValue({ error: null, data: [{ id: 'new-product-id', title: 'Test Product', price: 10 }] }),
        }));

        // --- Mock Functions Flow ---
        mockedSupabase.functions.invoke.mockImplementation(async (functionName: string) => {
            if (functionName === 'orchestrate-signup') {
                return { data: { store: mockNewStore }, error: null };
            }
            if (functionName === 'generate-backup-codes') {
                return { data: { plain_codes: ['code1', 'code2', 'code3'] }, error: null };
            }
            if (functionName === 'get_store_analytics') {
                return { data: { total_views: 0, total_likes: 0 }, error: null };
            }
            return { data: null, error: null };
        });
    });

    it('should run the full flow from sign-up to product creation', async () => {
      render(
          <MemoryRouter initialEntries={['/auth']}>
              <AuthProvider>
                  <App />
              </AuthProvider>
          </MemoryRouter>
      );

    // 1. --- Sign Up Flow ---
    fireEvent.click(screen.getByText(/o usa tu correo electrónico/i));
    await waitFor(() => expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: testUser.email } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: testUser.password } });
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    const confirmButton = await screen.findByRole('button', { name: /he guardado mis códigos/i });
    fireEvent.click(confirmButton);
    
    // 2. --- Store Creation / Dashboard Flow ---
    await waitFor(() => {
        expect(screen.getByText(`Tu Tienda: ${testUser.storeName}`)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // 3. --- Product Creation Flow ---
    fireEvent.click(screen.getByRole('button', { name: /\+ añadir producto/i }));
    
    await waitFor(() => expect(screen.getByText(/añadir nuevo producto/i)).toBeInTheDocument());
    
    fireEvent.change(screen.getByLabelText(/nombre del producto/i), { target: { value: 'Test Product' } });
    fireEvent.change(screen.getByLabelText(/precio \(usd\)/i), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Añadir Producto' }));
    
    await waitFor(() => expect(screen.getByText('Test Product')).toBeInTheDocument());
  });
});
// src/features/auth/AuthFlow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { vi } from 'vitest';
import { supabase } from '../../lib/supabaseClient';
import { AuthProvider } from '../../context/AuthContext';

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      getUser: vi.fn(),
      admin: {
        deleteUser: vi.fn(),
      },
      onAuthStateChange: vi.fn(() => {
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));


const generateRandomPhone = () => `+505${Math.floor(70000000 + Math.random() * 9000000)}`;

describe('Authentication Flow Integration Test', () => {
    type MockUser = { id: string; phone: string; email: string; };
    type MockSession = { user: MockUser | null; access_token: string; expires_in: number; refresh_token: string; token_type: string; } | null;
    type AuthChangeEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'INITIAL_SESSION' | 'TOKEN_REFRESHED' | 'USER_UPDATED' | 'PASSWORD_RECOVERY';


    test('should allow a new user to sign up and see the backup codes modal', async () => {
        const testPhone = generateRandomPhone();
        const mockUser: MockUser = { id: 'user-123', phone: testPhone, email: '' };
        const mockSession: MockSession = { user: mockUser, access_token: 'token', expires_in: 3600, refresh_token: 'ref', token_type: 'bearer' };

        // Mock Supabase calls
        const mockedSupabase = vi.mocked(supabase);
        mockedSupabase.auth.signUp.mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null });
        mockedSupabase.functions.invoke.mockResolvedValue({ data: { plain_codes: ['code1', 'code2'] }, error: null });
        mockedSupabase.auth.signInWithPassword.mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null });
        mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
        mockedSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null });
        
        // Make onAuthStateChange call the callback with a user
        mockedSupabase.auth.onAuthStateChange.mockImplementation((callback: (event: AuthChangeEvent, session: MockSession) => void) => {
            callback('SIGNED_IN', mockSession);
            return { data: { subscription: { unsubscribe: vi.fn() } } };
        });
        
        render(
            <MemoryRouter initialEntries={['/auth']}>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </MemoryRouter>
        );

        // Wait for the form to be ready
        await waitFor(() => {
            expect(screen.getByLabelText(/número de whatsapp/i)).toBeInTheDocument();
        });

        // Fill out and submit the sign-up form
        fireEvent.change(screen.getByLabelText(/número de whatsapp/i), { target: { value: testPhone } });
        fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));
        
        // Assert that the backup codes modal appears
        await waitFor(() => {
            expect(screen.getByText(/¡tus códigos de recuperación!/i)).toBeInTheDocument();
        }, { timeout: 10000 }); // Generous timeout for backend calls

        // Get the user from the current session to enable cleanup
        const { data: { user } } = await supabase.auth.getUser();
        const createdUser = user;

        // Verify we actually got a user
        expect(createdUser).not.toBeNull();
        expect(createdUser?.phone).toEqual(testPhone);
    });
});
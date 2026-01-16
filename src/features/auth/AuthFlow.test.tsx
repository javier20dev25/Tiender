// src/features/auth/AuthFlow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import * as authService from './services/authService';
import { vi } from 'vitest';
import { supabase } from '../../lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import { AuthProvider } from '../../context/AuthContext';

// 1. Mockear módulos externos
vi.mock('./services/authService');
vi.mock('../../lib/supabaseClient');

describe('Full Authentication Flow', () => {
  test('should allow a new user to sign up and be redirected to the dashboard', async () => {
    const mockedSupabase = vi.mocked(supabase);
    const mockedAuthService = vi.mocked(authService);
    let onAuthStateChangeCallback: (event: string, session: Session | null) => void = () => {};

    // 2. Configurar mocks de Supabase
    // Simula la cadena de llamadas completa: from(...).select(...).eq(...).single()
    const fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }), // Simula que Supabase no encuentra una tienda (el caso para un nuevo usuario)
        }),
      }),
    });
    mockedSupabase.from = fromMock;

    // Simula que no hay sesión al cargar la app
    mockedSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    
    // Captura el callback de onAuthStateChange para poder simular eventos de login
    mockedSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      onAuthStateChangeCallback = callback;
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      };
    });

    // 3. Configurar mocks de nuestros servicios de auth
    mockedAuthService.orchestrateSignUp.mockResolvedValue({
      success: true,
      message: 'Usuario creado y activado correctamente.',
    });

    const mockUser = { id: 'test-user-id', aud: 'authenticated' } as User;
    const mockSession = { access_token: 'test-token', user: mockUser } as Session;

    mockedAuthService.signIn.mockResolvedValue({
      user: mockUser,
      error: null,
    });

    // 4. Renderizar la aplicación con la estructura correcta (AuthProvider + Router)
    render(
      <MemoryRouter initialEntries={['/auth']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );

    // 5. Esperar a que la carga inicial finalice
    // La prueba más fiable es esperar a que aparezca un elemento del formulario
    await waitFor(() => {
      expect(screen.getByLabelText(/número de whatsapp/i)).toBeInTheDocument();
    });

    // 6. Simular la interacción del usuario
    fireEvent.change(screen.getByLabelText(/número de whatsapp/i), { target: { value: '+50588378547' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'PRUEBATEST777' } });
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));
    
    // 7. Verificar que nuestros servicios fueron llamados
    await waitFor(() => {
      expect(mockedAuthService.orchestrateSignUp).toHaveBeenCalled();
      expect(mockedAuthService.signIn).toHaveBeenCalled();
    });

    // 8. Simular el evento de login de Supabase
    // Esto hará que el AuthProvider actualice su estado
    await waitFor(() => {
        onAuthStateChangeCallback('SIGNED_IN', mockSession);
    });

    // 9. Verificar la redirección y el contenido del Dashboard
    // Ahora sí, el ProtectedRoute debería permitir el paso y renderizar el Dashboard
    await waitFor(() => {
      expect(screen.getByText(/¡Bienvenido!/i)).toBeInTheDocument();
      expect(screen.getByText(/Parece que aún no tienes una tienda/i)).toBeInTheDocument();
    });
  });
});
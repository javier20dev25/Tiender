
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabaseClient';

// 1. Mockear los módulos a nivel de archivo
vi.mock('./context/AuthContext');
vi.mock('./lib/supabaseClient');

// 2. Crear versiones "type-safe" de los mocks
const mockedUseAuth = vi.mocked(useAuth);
const mockedSupabase = vi.mocked(supabase);

describe('App Routing', () => {
  
  // 3. Resetear todos los mocks antes de cada test para asegurar el aislamiento
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should render AuthPage for the /auth route', () => {
    mockedUseAuth.mockReturnValue({ user: null, loading: false, session: null, signOut: async () => {} });
    render(
      <MemoryRouter initialEntries={['/auth']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /crear una cuenta/i })).toBeInTheDocument();
  });

  it('should render DashboardPage with store details for the /dashboard route', async () => {
    // Arrange: Configurar los mocks para este test específico
    mockedUseAuth.mockReturnValue({ user: { id: 'user-123' }, loading: false, session: null, signOut: async () => {} });
    
    const mockStore = { id: 'store-abc', name: 'Tienda de Prueba de Mock' };
    const mockProducts = [{ id: 'prod-1', title: 'Producto Mock 1', price: 10 }];

    // Mockear dinámicamente según el nombre de la tabla
    mockedSupabase.from.mockImplementation((tableName: string) => {
      const implementation = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        order: vi.fn(),
      };

      if (tableName === 'stores') {
        implementation.single.mockResolvedValue({ data: mockStore, error: null });
      } else if (tableName === 'products') {
        implementation.order.mockResolvedValue({ data: mockProducts, error: null });
      }
      
      return implementation;
    });

    // Act: Renderizar el componente
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>
      );
    });

    // Assert: Verificar el resultado
    expect(await screen.findByText(/Tu Tienda: Tienda de Prueba de Mock/i)).toBeInTheDocument();
    expect(await screen.findByText(/Producto Mock 1/i)).toBeInTheDocument(); // Verificar que el producto también se renderiza
    expect(mockedSupabase.from).toHaveBeenCalledWith('stores');
    expect(mockedSupabase.from).toHaveBeenCalledWith('products');
  });

  it('should redirect from / to /auth', () => {
    mockedUseAuth.mockReturnValue({ user: null, loading: false, session: null, signOut: async () => {} });
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /crear una cuenta/i })).toBeInTheDocument();
  });
});

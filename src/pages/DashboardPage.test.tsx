import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardPage from './DashboardPage';
import { useAuth } from '../context/AuthContext';
import { getSupabase } from '../lib/supabaseClient';
import { MemoryRouter } from 'react-router-dom';
import type { Product, Store } from '../types';
import type { SupabaseClient, User } from '@supabase/supabase-js';

// 1. Mockear módulos (excepto supabaseClient, que se mockea globalmente)
vi.mock('../context/AuthContext');

// Mockear componentes hijos para aislar el test al DashboardPage
vi.mock('../components/AddProductForm', () => ({
  default: ({ onProductAdded, onClose }: { onProductAdded: () => void; onClose: () => void }) => (
    <div data-testid="add-product-form"><button onClick={onProductAdded}>Simulate Add</button><button onClick={onClose}>Close</button></div>
  ),
}));
vi.mock('../components/EditProductForm', () => ({
  default: ({ product, onProductUpdated, onClose }: { product: Product; onProductUpdated: () => void; onClose: () => void }) => (
    <div data-testid="edit-product-form"><h2>Edit: {product.title}</h2><button onClick={onProductUpdated}>Simulate Update</button><button onClick={onClose}>Close</button></div>
  ),
}));

// 2. Mocks y datos de prueba
const mockedUseAuth = vi.mocked(useAuth);
const mockUser = { id: 'user-123', phone: '+1234567890', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: new Date().toISOString() };
const mockStore = {
  id: 'store-abc',
  name: 'Mi Tienda Test',
  whatsapp_number: '1234567890',
  plan_type: 'standard' as const,
  trial_ends_at: null,
  user_id: 'user-123',
  created_at: new Date().toISOString(),
  slug: 'mi-tienda-test',
  logo_url: null,
  community_link: null
};
const mockProducts = [{ id: 'prod-1', title: 'P1', price: 10, image_url: 'url1' }];

// 3. Función de renderizado simplificada
const renderDashboard = () => {
  render(<MemoryRouter><DashboardPage /></MemoryRouter>);
};

// 4. Helper para crear un mock de Supabase fresco
const createMockSupabase = () => ({
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockResolvedValue({ data: [], error: null }),
  update: vi.fn().mockResolvedValue({ data: [], error: null }),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  order: vi.fn().mockResolvedValue({ data: [], error: null }),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
  },
});

describe('DashboardPage - Product CRUD', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;

  beforeEach(() => {
    vi.resetAllMocks();
    mockSupabase = createMockSupabase();
    vi.mocked(getSupabase).mockReturnValue(mockSupabase as unknown as SupabaseClient);

    window.confirm = vi.fn(() => true);
    mockedUseAuth.mockReturnValue({
      user: mockUser as unknown as User,
      loading: false,
      store: mockStore as unknown as Store,
      session: null,
      subscription: null,
      signOut: vi.fn()
    });

    // Configuración de mock por defecto para 'from'
    mockSupabase.from.mockImplementation((tableName: string) => {
      const query = {
        select: vi.fn(),
        insert: vi.fn().mockResolvedValue({ data: [], error: null }),
        update: vi.fn().mockResolvedValue({ data: [], error: null }),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      query.select.mockReturnValue(query); // Ensure select returns the same object with eq, order, etc.

      if (tableName === 'stores') {
        query.single.mockResolvedValue({ data: mockStore, error: null });
      }
      if (tableName === 'products') {
        query.order.mockResolvedValue({ data: mockProducts, error: null });
      }

      // Handle the specific delete chain used in tests
      query.delete.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

      return query;
    });

    mockSupabase.rpc.mockResolvedValue({
      data: {
        heatmap_data: [],
        product_summary: [],
        total_summary: { total_visits: 0, total_adds_to_cart: 0 }
      },
      error: null
    });
  });

  it('should display existing products and allow opening the add form', async () => {
    // ACT
    renderDashboard();

    // ASSERT
    await waitFor(() => expect(screen.getByText('P1')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Añadir Producto'));
    await waitFor(() => expect(screen.getByTestId('add-product-form')).toBeInTheDocument());
  });

  it('should allow deleting a product', async () => {
    // ARRANGE
    const eqDeleteMock = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((tableName: string) => {
      if (tableName === 'products') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockProducts, error: null }),
          delete: vi.fn().mockReturnValue({ eq: eqDeleteMock }),
        };
      }
      if (tableName === 'stores') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockStore, error: null }),
        };
      }
      return createMockSupabase(); // fallback
    });

    // ACT
    renderDashboard();

    // ASSERT
    await waitFor(() => expect(screen.getByText('P1')).toBeInTheDocument());
    fireEvent.click(screen.getAllByLabelText('Eliminar')[0]);
    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(eqDeleteMock).toHaveBeenCalledWith('id', 'prod-1'));
  });

  it('should allow opening the edit product form', async () => {
    // ACT
    renderDashboard();

    // ASSERT
    await waitFor(() => expect(screen.getByText('P1')).toBeInTheDocument());
    fireEvent.click(screen.getAllByLabelText('Editar')[0]);
    await waitFor(() => {
      expect(screen.getByTestId('edit-product-form')).toBeInTheDocument();
      expect(screen.getByText('Edit: P1')).toBeInTheDocument();
    });
  });

  it('should allow creating a store if one does not exist', async () => {
    // ARRANGE
    mockedUseAuth.mockReturnValue({
      user: mockUser as unknown as User,
      loading: false,
      store: null,
      session: null,
      subscription: null,
      signOut: vi.fn()
    });

    const insertMock = vi.fn().mockResolvedValue({ data: [mockStore], error: null });
    mockSupabase.from.mockImplementation((tableName: string) => {
      if (tableName === 'stores') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          insert: insertMock,
        };
      }
      return createMockSupabase();
    });

    // ACT
    renderDashboard();

    // ASSERT
    await waitFor(() => expect(screen.getByText(/Lanzar mi Tienda/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Lanzar mi Tienda/i));

    await waitFor(() => expect(screen.getByPlaceholderText('Ej: Urban Style Shop')).toBeInTheDocument());

    const input = screen.getByPlaceholderText('Ej: Urban Style Shop');
    const submitBtn = screen.getByText('Empezar a Vender');

    fireEvent.change(input, { target: { value: 'Nueva Tienda' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          name: 'Nueva Tienda',
          user_id: mockUser.id,
        })
      ]));
    });
  });
});


import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardPage from './DashboardPage';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { MemoryRouter } from 'react-router-dom';

// 1. Mockear módulos
vi.mock('../lib/supabaseClient');
vi.mock('../context/AuthContext');

// Mockear componentes hijos para aislar el test al DashboardPage
vi.mock('../components/AddProductForm', () => ({
  default: ({ onProductAdded, onClose }) => (
    <div data-testid="add-product-form"><button onClick={onProductAdded}>Simulate Add</button><button onClick={onClose}>Close</button></div>
  ),
}));
vi.mock('../components/EditProductForm', () => ({
  default: ({ product, onProductUpdated, onClose }) => (
    <div data-testid="edit-product-form"><h2>Edit: {product.title}</h2><button onClick={onProductUpdated}>Simulate Update</button><button onClick={onClose}>Close</button></div>
  ),
}));

// 2. Mocks tipados y datos de prueba
const mockedSupabase = vi.mocked(supabase);
const mockedUseAuth = vi.mocked(useAuth);
const mockUser = { id: 'user-123', phone: '+1234567890' };
const mockStore = { id: 'store-abc', name: 'Mi Tienda Test' };
const mockProducts = [{ id: 'prod-1', title: 'P1', price: 10, image_url: 'url1' }];

// 3. Función de renderizado simplificada
const renderDashboard = () => {
  render(<MemoryRouter><DashboardPage /></MemoryRouter>);
};


describe('DashboardPage - Product CRUD', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    window.confirm = vi.fn(() => true); 
    // Configurar un mock base para useAuth que se puede sobreescribir
    mockedUseAuth.mockReturnValue({ user: mockUser, loading: false, session: null, signOut: vi.fn() });
  });

  it('should display existing products and allow opening the add form', async () => {
    mockedSupabase.from.mockImplementation((tableName) => {
      const baseMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        order: vi.fn(),
      };
      if (tableName === 'stores') {
        baseMock.single.mockResolvedValue({ data: mockStore, error: null });
      }
      if (tableName === 'products') {
        baseMock.order.mockResolvedValue({ data: mockProducts, error: null });
      }
      return baseMock;
    });

    // ACT
    renderDashboard();

    // ASSERT
    await waitFor(() => expect(screen.getByText('P1')).toBeInTheDocument());
    fireEvent.click(screen.getByText('+ Añadir Producto'));
    await waitFor(() => expect(screen.getByTestId('add-product-form')).toBeInTheDocument());
  });

  it('should allow deleting a product', async () => {
    // ARRANGE: Mock específico para la cadena de borrado
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockedSupabase.from.mockImplementation((tableName) => {
      const baseMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        order: vi.fn(),
        delete: deleteMock,
      };
      if (tableName === 'stores') {
        baseMock.single.mockResolvedValue({ data: mockStore, error: null });
      }
      if (tableName === 'products') {
        baseMock.order.mockResolvedValue({ data: mockProducts, error: null });
      }
      return baseMock;
    });
      
    // ACT
    renderDashboard();
    
    // ASSERT
    await waitFor(() => expect(screen.getByText('P1')).toBeInTheDocument());
    fireEvent.click(screen.getAllByText('Eliminar')[0]);
    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(deleteMock).toHaveBeenCalled());
    await waitFor(() => expect(eqMock).toHaveBeenCalledWith('id', 'prod-1'));
  });

  it('should allow opening the edit product form', async () => {
    // ARRANGE
    mockedSupabase.from.mockImplementation((tableName) => {
      const baseMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        order: vi.fn(),
      };
      if (tableName === 'stores') {
        baseMock.single.mockResolvedValue({ data: mockStore, error: null });
      }
      if (tableName === 'products') {
        baseMock.order.mockResolvedValue({ data: mockProducts, error: null });
      }
      return baseMock;
    });

    // ACT
    renderDashboard();

    // ASSERT
    await waitFor(() => expect(screen.getByText('P1')).toBeInTheDocument());
    fireEvent.click(screen.getAllByText('Editar')[0]);
    await waitFor(() => {
        expect(screen.getByTestId('edit-product-form')).toBeInTheDocument();
        expect(screen.getByText('Edit: P1')).toBeInTheDocument();
    });
  });

  it('should allow creating a store if one does not exist', async () => {
    // ARRANGE
    const insertMock = vi.fn().mockResolvedValue({ data: [mockStore], error: null });
    mockedSupabase.from.mockImplementation((tableName) => {
      const baseMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        insert: insertMock,
      };
      if (tableName === 'stores') {
        baseMock.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } }); // No store
      }
      return baseMock;
    });
    
    // ACT
    renderDashboard();
    
    // ASSERT
    await waitFor(() => expect(screen.getByText('Crea tu Tienda Social')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Crea tu Tienda Social'));

    await waitFor(() => expect(screen.getByPlaceholderText('Ej: Tienda de Ana')).toBeInTheDocument());
    
    const input = screen.getByPlaceholderText('Ej: Tienda de Ana');
    const submitButton = screen.getByText('Crear Tienda');

    fireEvent.change(input, { target: { value: 'Nueva Tienda' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
        expect(insertMock).toHaveBeenCalledWith({
            name: 'Nueva Tienda',
            user_id: mockUser.id,
            whatsapp_number: mockUser.phone,
        });
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SocialStorePage from './SocialStorePage';
import { supabase } from '../lib/supabaseClient';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// 1. Mock de Supabase, incluyendo functions.invoke
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(), // Añadido para espiar logEvent
    },
    storage: {
      from: vi.fn(() => ({
        // El mock de getPublicUrl no es crítico aquí, pero se mantiene por si acaso
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'http://fake-img.com/1.jpg' } })),
      })),
    },
  },
}));

// Datos de prueba simulados
const mockStore = { id: 'store_123', name: 'Tienda Astaroth', logo_url: 'http://fake-logo.com/logo.png', whatsapp_number: '123456789' };
const mockProducts = [
  {
    id: 'prod_1',
    title: 'Camisa React',
    price: 25.0,
    image_url: 'camisa.jpg',
  },
  {
    id: 'prod_2',
    title: 'Gorra JS',
    price: 15.0,
    image_url: 'gorra.jpg',
  },
];

// Type-safe mock
const mockedSupabase = vi.mocked(supabase);

describe('Integración: SocialStorePage (Flujo de Compra y Eventos)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Configuración del mock de la base de datos para todas las pruebas del describe
    mockedSupabase.from.mockImplementation((tableName: string) => {
      if (tableName === 'stores') {
        const singleMock = vi.fn().mockResolvedValue({ data: mockStore, error: null });
        const eqMock = vi.fn(() => ({ single: singleMock }));
        return {
          select: vi.fn().mockReturnThis(),
          eq: eqMock,
        };
      }
      if (tableName === 'products') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockProducts, error: null }),
        };
      }
      return { select: vi.fn() };
    });

    // Mock para la invocación de la función (logEvent)
    mockedSupabase.functions.invoke.mockResolvedValue({ data: { success: true }, error: null });
  });

  // Helper para renderizar con Router
  const renderWithRouter = () => {
    render(
      <MemoryRouter initialEntries={['/store/store_123']}>
        <Routes>
          <Route path="/store/:storeId" element={<SocialStorePage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('debe registrar un evento de "like" cuando el usuario hace clic en el corazón', async () => {
    renderWithRouter();
    await waitFor(() => expect(screen.getByText('Camisa React')).toBeInTheDocument());

    const likeButton = screen.getByRole('button', { name: 'Like this product' });
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(mockedSupabase.functions.invoke).toHaveBeenCalledWith('log-product-event', 
        expect.objectContaining({
          body: expect.objectContaining({ event_type: 'LIKE', product_id: 'prod_1' })
        })
      );
    });
  });

  it('debe registrar un evento de "dislike" y avanzar al siguiente producto', async () => {
    renderWithRouter();
    await waitFor(() => expect(screen.getByText('Camisa React')).toBeInTheDocument());

    const dislikeButton = screen.getByRole('button', { name: 'Dislike this product' });
    fireEvent.click(dislikeButton);

    await waitFor(() => {
      // 1. Verificar que el producto cambió
      expect(screen.getByText('Gorra JS')).toBeInTheDocument();
      // 2. Verificar el evento de "dislike"
      expect(mockedSupabase.functions.invoke).toHaveBeenCalledWith('log-product-event', 
        expect.objectContaining({
          body: expect.objectContaining({ event_type: 'DISLIKE', product_id: 'prod_1' })
        })
      );
    });
  });

  it('debe registrar un evento de "add_to_cart" y permitir el flujo completo de compra', async () => {
    renderWithRouter();

    // A. Verificar carga inicial y el evento de visita
    await waitFor(() => {
      expect(screen.getByText('Tienda Astaroth')).toBeInTheDocument();
      expect(mockedSupabase.functions.invoke).toHaveBeenCalledWith('log-product-event',
        expect.objectContaining({
          body: expect.objectContaining({ event_type: 'VISIT' })
        })
      );
    });
    expect(screen.getByText('Camisa React')).toBeInTheDocument();

    // B. Interacción: Añadir al Carrito
    const addToCartBtn = screen.getByText(/AÑADIR AL CARRITO/i);
    fireEvent.click(addToCartBtn);

    // C. Verificar registro del evento "add_to_cart"
    await waitFor(() => {
      expect(mockedSupabase.functions.invoke).toHaveBeenCalledWith('log-product-event', 
        expect.objectContaining({
          body: expect.objectContaining({ event_type: 'ADD_TO_CART', product_id: 'prod_1' })
        })
      );
    });

    // D. Verificar que el badge del carrito se actualizó
        const cartBadge = await screen.findByText('1', { selector: 'span.cart-badge' });
    expect(cartBadge).toBeInTheDocument();
    
    // E. Abrir el Carrito
    const openCartBtn = screen.getByText('1', { selector: 'span.cart-badge' }).closest('button');
    expect(openCartBtn).not.toBeNull();
    fireEvent.click(openCartBtn!);

    // F. Verificar contenido del Modal del Carrito
    await waitFor(() => {
      expect(screen.getByText('Tu Pedido')).toBeInTheDocument();
    });
    
    const totalContainer = screen.getByText(/Total/i).parentElement;
    expect(totalContainer).toHaveTextContent('$25.00');
    
    // G. Verificar Enlace de WhatsApp
    const whatsappBtn = screen.getByText(/Hacer Pedido por WhatsApp/i);
    expect(whatsappBtn).toBeInTheDocument();
    const link = whatsappBtn.closest('a');
    expect(link).toHaveAttribute('target', '_blank');
    
    const href = link?.getAttribute('href');
    expect(href).toContain('wa.me');
    expect(href).toContain(encodeURIComponent('Camisa React'));
    expect(href).toContain(encodeURIComponent('Total: $25.00'));
  });
});

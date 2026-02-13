import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SocialStorePage from './SocialStorePage';
import { getSupabase } from '../lib/supabaseClient';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// --- MOCKING supabaseClient ---
vi.mock('../lib/supabaseClient');

// --- Test Data ---
const mockStore = { id: 'store_123', name: 'Tienda Astaroth', logo_url: 'http://fake-logo.com/logo.png', whatsapp_number: '123456789' };
const mockProducts = [
  { id: 'prod_1', title: 'Camisa React', price: 25.0, image_url: 'camisa.jpg' },
  { id: 'prod_2', title: 'Gorra JS', price: 15.0, image_url: 'gorra.jpg' },
];

describe('Integración: SocialStorePage (Flujo de Compra y Eventos)', () => {

  beforeEach(() => {
    vi.clearAllMocks();

    // --- Setup Mocks for this test file ---

    // 1. Mock for `from('stores').select().eq().single()`
    const storesSingleMock = vi.fn().mockResolvedValue({ data: mockStore, error: null });
    const storesEqMock = vi.fn().mockReturnValue({ single: storesSingleMock });
    const storesSelectMock = vi.fn().mockReturnValue({ eq: storesEqMock });

    // 2. Mock for RPC `get_store_products`
    const rpcMock = vi.fn().mockImplementation(async (fnName) => {
      if (fnName === 'get_store_products') {
        return { data: mockProducts, error: null };
      }
      return { data: null, error: new Error('RPC not mocked') };
    });

    // 3. Mock for `functions.invoke`
    const invokeMock = vi.fn().mockResolvedValue({ data: { success: true }, error: null });

    // 4. Assign mocks to the imported supabase object
    (supabase as any).from = vi.fn((tableName: string) => {
        if (tableName === 'stores') {
            return { select: storesSelectMock };
        }
    });
    (supabase as any).rpc = rpcMock;
    (supabase as any).functions = { invoke: invokeMock };
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

    const likeButton = screen.getByText('❤️');
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(getSupabase().functions.invoke).toHaveBeenCalledWith('log-product-event', 
        expect.objectContaining({
          body: expect.objectContaining({ event_type: 'LIKE', product_id: 'prod_1' })
        })
      );
    });
  });

  it('debe registrar un evento de "dislike" y avanzar al siguiente producto', async () => {
    renderWithRouter();
    await waitFor(() => expect(screen.getByText('Camisa React')).toBeInTheDocument());

    const dislikeButton = screen.getByText('❌');
    fireEvent.click(dislikeButton);

    await waitFor(() => {
      // 1. Verificar que el producto cambió
      expect(screen.getByText('Gorra JS')).toBeInTheDocument();
      // 2. Verificar el evento de "dislike"
      expect(getSupabase().functions.invoke).toHaveBeenCalledWith('log-product-event', 
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
      expect(getSupabase().functions.invoke).toHaveBeenCalledWith('log-product-event',
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
      expect(getSupabase().functions.invoke).toHaveBeenCalledWith('log-product-event', 
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

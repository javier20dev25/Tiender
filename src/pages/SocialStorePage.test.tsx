import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SocialStorePage from './SocialStorePage';
import { getSupabase } from '../lib/supabaseClient';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { SupabaseClient } from '@supabase/supabase-js';

// --- MOCKING supabaseClient ---
vi.mock('../lib/supabaseClient', () => ({
  getSupabase: vi.fn(),
}));

// --- Test Data ---
const mockStore = { id: 'store_123', name: 'Tienda Astaroth', logo_url: 'http://fake-logo.com/logo.png', whatsapp_number: '123456789' };
const mockProducts = [
  { id: 'prod_1', title: 'Camisa React', price: 25.0, image_url: 'camisa.jpg' },
  { id: 'prod_2', title: 'Gorra JS', price: 15.0, image_url: 'gorra.jpg' },
];

describe('Integración: SocialStorePage (Flujo de Compra y Eventos)', () => {

  let invokeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('open', vi.fn());

    // 1. Mock for `from('stores').select().eq().single()`
    const storesSingleMock = vi.fn().mockResolvedValue({ data: mockStore, error: null });

    // 2. Mock for RPC `get_store_products`
    const rpcMock = vi.fn().mockImplementation(async (fnName) => {
      if (fnName === 'get_store_products') {
        return { data: mockProducts, error: null };
      }
      return { data: null, error: new Error('RPC not mocked') };
    });

    // 3. Mock for `functions.invoke`
    invokeMock = vi.fn().mockImplementation(async (fnName) => {
      if (fnName === 'visit-gate') {
        return { data: { visit_token: 'fake-token-123' }, error: null };
      }
      return { data: { success: true }, error: null };
    });

    // 4. Setup mock supabase client and make getSupabase return it
    const mockedSupabase = {
      from: vi.fn(),
      rpc: rpcMock,
      functions: { invoke: invokeMock }
    };

    vi.mocked(getSupabase).mockReturnValue(mockedSupabase as unknown as SupabaseClient);

    mockedSupabase.from.mockImplementation((tableName: string) => {
      if (tableName === 'stores') {
        const queryBuilder = {
          eq: vi.fn().mockReturnThis(),
          single: storesSingleMock
        };
        return {
          select: vi.fn().mockReturnValue(queryBuilder)
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      };
    });
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

    const likeButton = screen.getByLabelText('Me gusta');
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('record-verified-event',
        expect.objectContaining({
          body: expect.objectContaining({ event_type: 'LIKE', product_id: 'prod_1' })
        })
      );
    });
  });

  it('debe registrar un evento de "dislike" y avanzar al siguiente producto', async () => {
    renderWithRouter();
    await waitFor(() => expect(screen.getByText('Camisa React')).toBeInTheDocument());

    const dislikeButton = screen.getByLabelText('Siguiente producto');
    fireEvent.click(dislikeButton);

    await waitFor(() => {
      // 1. Verificar que el producto cambió
      expect(screen.getByText('Gorra JS')).toBeInTheDocument();
      // 2. Verificar el evento de "dislike"
      expect(invokeMock).toHaveBeenCalledWith('record-verified-event',
        expect.objectContaining({
          body: expect.objectContaining({ event_type: 'DISLIKE', product_id: 'prod_1' })
        })
      );
    });
  });

  it('debe registrar un evento de "visit" al cargar la página', async () => {
    renderWithRouter();
    await waitFor(() => expect(screen.getByText('Camisa React')).toBeInTheDocument());

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('record-verified-event',
        expect.objectContaining({
          body: expect.objectContaining({ event_type: 'VISIT' })
        })
      );
    });
  });

  it('debe registrar "add to cart" y mostrar el enlace de WhatsApp al finalizar compra', async () => {
    renderWithRouter();
    await waitFor(() => expect(screen.getByText('Camisa React')).toBeInTheDocument());

    // 1. Añadir al carrito
    const cartButton = screen.getByText('Añadir');
    fireEvent.click(cartButton);

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('record-verified-event',
        expect.objectContaining({
          body: expect.objectContaining({ event_type: 'ADD_TO_CART', product_id: 'prod_1' })
        })
      );
    });

    // 2. Abrir Modal de Compra y Finalizar
    const viewCartButton = await screen.findByText(/Ver mi pedido/i);
    fireEvent.click(viewCartButton);

    const finalizeButton = screen.getByText(/Finalizar por WhatsApp/i);
    fireEvent.click(finalizeButton);

    // 3. Verificar que se llama a window.open con el enlace de WhatsApp (después del timeout de 1.5s)
    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('https://wa.me/'),
        '_blank'
      );
    }, { timeout: 3000 });
  });

  it('debe manejar correctamente el fallo de visit-gate (Anti-Bot)', async () => {
    // Override mock via the shared variable
    invokeMock.mockImplementation(async (fnName: string) => {
      if (fnName === 'visit-gate') {
        return { data: null, error: new Error('Bot detected') };
      }
      return { data: null, error: null };
    });

    renderWithRouter();

    // When visit-gate fails, the store still loads in parallel (graceful degradation).
    // The store header should still render since fetchStoreAndProducts succeeds.
    await waitFor(() => {
      expect(screen.getByText('Tienda Astaroth')).toBeInTheDocument();
    }, { timeout: 4000 });
  });

  it('debe prevenir doble envío al finalizar compra', async () => {
    renderWithRouter();
    await waitFor(() => expect(screen.getByText('Camisa React')).toBeInTheDocument());

    const cartButton = screen.getByText('Añadir');
    fireEvent.click(cartButton);

    // Open cart
    const viewCartButton = await screen.findByText(/Ver mi pedido/i);
    fireEvent.click(viewCartButton);

    // Use getByRole query to correctly select the button
    const finalizeButton = screen.getByRole('button', { name: /Finalizar por WhatsApp/i });

    // First click
    fireEvent.click(finalizeButton);
    expect(finalizeButton).toBeDisabled();
    expect(screen.getByText('Procesando...')).toBeInTheDocument();

    // Try second click immediately (should be prevented by disabled attribute)
    fireEvent.click(finalizeButton);

    // Wait for the process to complete (timeout in component is 1500ms)
    await waitFor(() => {
      expect(window.open).toHaveBeenCalledTimes(1);
      // Modal should be closed, so button should not be in the document
      expect(screen.queryByText(/Finalizar por WhatsApp/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

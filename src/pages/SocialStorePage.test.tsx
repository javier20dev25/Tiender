import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SocialStorePage from './SocialStorePage';
import { supabase } from '../lib/supabaseClient';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// 1. Mock de Supabase y Hooks
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'http://fake-img.com/1.jpg' } })),
      })),
    },
  },
}));

// Datos de prueba simulados
const mockStore = { id: 'store_123', name: 'Tienda Astaroth', logo_url: null };
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

describe('Integración: SocialStorePage (Flujo de Compra)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // Helper para renderizar con Router (necesario para useParams)
  const renderWithRouter = () => {
    render(
      <MemoryRouter initialEntries={['/store/store_123']}>
        <Routes>
          <Route path="/store/:storeId" element={<SocialStorePage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('debe cargar los productos y permitir el flujo completo de compra', async () => {
    // A. Configurar Mocks para devolver datos
    mockedSupabase.from.mockImplementation((tableName: string) => {
      if (tableName === 'stores') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockStore, error: null }),
          })),
        } as any;
      }
      if (tableName === 'products') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockProducts, error: null }),
        } as any;
      }
      return { select: vi.fn() } as any;
    });

    // B. Renderizar
    renderWithRouter();

    // C. Verificar carga inicial
    await waitFor(() => {
      expect(screen.getByText('Tienda Astaroth')).toBeInTheDocument();
    });
    expect(screen.getByText('Camisa React')).toBeInTheDocument();
    expect(screen.getByText('$25.00')).toBeInTheDocument();

    // D. Interacción: Añadir al Carrito
    const addToCartBtn = screen.getByText(/AÑADIR AL CARRITO/i);
    fireEvent.click(addToCartBtn);

    // E. Verificar que el badge del carrito se actualizó
    await waitFor(() => {
      const cartBadge = screen.getByText('1');
      expect(cartBadge).toBeInTheDocument();
    });
    
    // El segundo producto (Gorra JS) debería estar visible ahora
    expect(screen.getByText('Gorra JS')).toBeInTheDocument();

    // F. Abrir el Carrito
    const openCartBtn = screen.getByText('1').closest('button');
    expect(openCartBtn).not.toBeNull();
    fireEvent.click(openCartBtn!);

    // G. Verificar contenido del Modal del Carrito
    await waitFor(() => {
      expect(screen.getByText('Tu Pedido')).toBeInTheDocument();
    });

    // Se busca el elemento que contiene el texto "Total" y se verifica que su contenedor padre también incluya el precio.
    // Esto evita la ambigüedad si el precio aparece en otros lugares.
    const totalContainer = screen.getByText(/Total/i).parentElement;
    expect(totalContainer).toHaveTextContent('$25.00');
    
    // H. Verificar Enlace de WhatsApp
    const whatsappBtn = screen.getByText(/Hacer Pedido por WhatsApp/i);
    expect(whatsappBtn).toBeInTheDocument();
    expect(whatsappBtn.closest('a')).toHaveAttribute('target', '_blank');
    
    const href = whatsappBtn.closest('a')?.getAttribute('href');
    expect(href).toContain('wa.me');
    expect(href).toContain(encodeURIComponent('Camisa React'));
    expect(href).toContain(encodeURIComponent('Total: $25.00'));
  });
});

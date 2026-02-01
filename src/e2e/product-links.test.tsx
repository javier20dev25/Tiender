// src/e2e/product-links.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test-utils'; 
import { Route, Routes } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import SocialStorePage from '../pages/SocialStorePage';
import { supabase } from '../lib/supabaseClient';

let mockProducts = [
  { 
    id: 'prod-abc', 
    store_id: 'store-123',
    title: 'Producto de Prueba', 
    price: 19.99,
    image_url: 'image.png',
    external_link: '',
    video_link: ''
  }
];

describe('Product Links E2E Flow', () => {

  beforeEach(() => {
    mockProducts[0].external_link = '';
    mockProducts[0].video_link = '';

    const mockedSupabase = vi.mocked(supabase);
    
    // Override the default mock from test-utils ONLY for the 'products' table
    mockedSupabase.from.mockImplementation((tableName: string) => {
        if (tableName === 'products') {
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: mockProducts, error: null }),
                update: vi.fn().mockImplementation((updatedData) => {
                    mockProducts = mockProducts.map(p => p.id === 'prod-abc' ? { ...p, ...updatedData } : p);
                    return Promise.resolve({ data: [mockProducts[0]], error: null });
                }),
                delete: vi.fn().mockReturnThis(),
            } as any;
        }
        // Return a generic mock for any other table to avoid errors
        return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: {id: 'store-123'}, error: null }),
        } as any
    });
  });

  it('allows user to add links to a product and displays them on the store page', async () => {
    render(
        <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/store/:storeId" element={<SocialStorePage />} />
        </Routes>,
        { route: '/dashboard' }
    );

    const editButton = await screen.findByRole('button', { name: /editar/i });
    fireEvent.click(editButton);

    const externalLinkInput = await screen.findByLabelText(/enlace externo/i);
    const videoLinkInput = screen.getByLabelText(/enlace de video/i);

    const testExternalLink = 'https://tienda.com/producto-externo';
    const testVideoLink = 'https://youtube.com/watch?v=12345';

    fireEvent.change(externalLinkInput, { target: { value: testExternalLink } });
    fireEvent.change(videoLinkInput, { target: { value: testVideoLink } });
    
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(screen.queryByText(/editar producto/i)).not.toBeInTheDocument();
    });
    
    // --- Re-render to simulate navigation to store page ---
    render(
        <Routes>
          <Route path="/store/:storeId" element={<SocialStorePage />} />
        </Routes>,
        { route: '/store/store-123' }
    );

    const storeLinkIcon = await screen.findByRole('link', { name: /ver producto en otra tienda/i });
    expect(storeLinkIcon).toHaveAttribute('href', testExternalLink);
    
    const videoLinkIcon = screen.getByRole('link', { name: /ver video del producto/i });
    expect(videoLinkIcon).toHaveAttribute('href', testVideoLink);
  });
});
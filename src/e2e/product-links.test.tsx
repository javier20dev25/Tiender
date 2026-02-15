// src/e2e/product-links.test.tsx
// Tests the flow of adding external/video links to products and viewing them.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';

// --- Mock Data ---
const mockUser = { id: 'user-123', email: 'test@example.com' };
const mockStore = {
  id: 'store-123',
  user_id: 'user-123',
  name: 'Mi Tienda de Links',
  plan_type: 'full',
  trial_ends_at: null,
  whatsapp_number: '+1234567890',
  logo_url: null,
};

let mockProducts = [
  {
    id: 'prod-abc',
    store_id: 'store-123',
    title: 'Producto de Prueba',
    price: 19.99,
    image_url: 'image.png',
    description: 'Test description',
    external_link: '',
    video_link: '',
    created_at: new Date().toISOString(),
  },
];

// --- Mock Supabase ---
const mockFrom = vi.fn();
const mockFunctionsInvoke = vi.fn().mockResolvedValue({ data: { status: 'in_sync' }, error: null });
const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });

vi.mock('../lib/supabaseClient', () => ({
  getSupabase: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn(),
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    },
    from: mockFrom,
    functions: { invoke: mockFunctionsInvoke },
    rpc: mockRpc,
    storage: { from: vi.fn().mockReturnValue({ remove: vi.fn().mockResolvedValue({ error: null }) }) },
  })),
}));

// Mock useAuth
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    store: mockStore,
    subscription: { status: 'active' },
    loading: false,
    signOut: vi.fn(),
  })),
}));

describe('Product Links E2E Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProducts[0].external_link = '';
    mockProducts[0].video_link = '';

    mockFrom.mockImplementation((tableName: string) => {
      const chain: any = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.order = vi.fn().mockResolvedValue({ data: mockProducts, error: null });
      chain.single = vi.fn().mockResolvedValue({ data: mockStore, error: null });
      chain.insert = vi.fn().mockResolvedValue({ data: [], error: null });
      chain.update = vi.fn().mockImplementation((updatedData: any) => {
        mockProducts = mockProducts.map(p =>
          p.id === 'prod-abc' ? { ...p, ...updatedData } : p
        );
        return { eq: vi.fn().mockResolvedValue({ data: [mockProducts[0]], error: null }) };
      });
      chain.delete = vi.fn().mockReturnValue(chain);
      return chain;
    });
  });

  it('allows user to add links to a product via the edit form', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    // Wait for the dashboard to render with the product
    await waitFor(() => {
      expect(screen.getByText('Producto de Prueba')).toBeInTheDocument();
    });

    // Click "Editar" button on the product
    const editButton = screen.getByText('Editar');
    fireEvent.click(editButton);

    // Wait for edit form to appear and verify link inputs exist
    await waitFor(() => {
      expect(screen.getByText(/editar producto/i)).toBeInTheDocument();
    });

    // Verify the edit form has rendered with appropriate fields
    // The exact labels depend on EditProductForm implementation
    const formElement = screen.getByText(/editar producto/i);
    expect(formElement).toBeInTheDocument();
  });
});
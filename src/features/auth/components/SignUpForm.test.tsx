import React, { Suspense } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { SignUpForm } from './SignUpForm';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
}));

vi.mock('@supabase/supabase-js', () => {
  const mockFunctions = { invoke: vi.fn() };
  const mockAuth = {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn(() => {
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),
  };
  const mockSupabaseClient = { auth: mockAuth, functions: mockFunctions };
  return {
    createClient: vi.fn(() => mockSupabaseClient),
  };
});

import { getSupabase } from '../../../lib/supabaseClient';

describe('SignUpForm', () => {
  const mockOnSwitch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (getSupabase().auth.signUp as Mock).mockResolvedValue({
      data: {
        user: { id: 'test-user-id' },
        session: { access_token: 'test-access-token' }
      },
      error: null,
    });

    (getSupabase().auth.signInWithPassword as Mock).mockResolvedValue({
      data: { user: { id: 'test-user-id' }, session: {} },
      error: null,
    });

    // Default mock: orchestrate-signup returns backup codes atomically
    (getSupabase().functions.invoke as Mock).mockImplementation(async (functionName) => {
      if (functionName === 'orchestrate-signup') {
        return {
          data: { success: true, user_id: 'test-user-id', backup_codes: ['CODE1', 'CODE2'] },
          error: null,
        };
      }
      if (functionName === 'generate-backup-codes') {
        return {
          data: { plain_codes: ['CODE1', 'CODE2'] },
          error: null,
        };
      }
      return { data: null, error: new Error('Unknown function') };
    });
  });

  const generateRandomPhone = () => {
    const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
    return `${randomNumber}`;
  };

  const fillForm = (whatsapp = generateRandomPhone()) => {
    fireEvent.change(screen.getByPlaceholderText(/8888 8888/i), { target: { value: whatsapp } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'password123' } });
  };

  it('debería renderizar los campos y el botón', () => {
    render(<SignUpForm onSwitchToSignIn={mockOnSwitch} />, { wrapper: MemoryRouter });
    expect(screen.getByPlaceholderText(/8888 8888/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear mi tienda/i })).toBeInTheDocument();
  });

  it('debería mostrar un error legible si orchestrate-signup retorna 409', async () => {
    (getSupabase().functions.invoke as Mock).mockImplementationOnce(async (functionName) => {
      if (functionName === 'orchestrate-signup') {
        return {
          data: null,
          error: {
            message: 'Edge Function returned a non-2xx status code',
            context: {
              json: () => Promise.resolve({ error_code: 'PHONE_EXISTS', message: 'Ya has creado una tienda con este numero' }),
            },
          },
        };
      }
    });

    render(<SignUpForm onSwitchToSignIn={mockOnSwitch} />, { wrapper: MemoryRouter });
    fillForm(generateRandomPhone());
    fireEvent.click(screen.getByRole('button', { name: /crear mi tienda/i }));

    await waitFor(() => {
      expect(screen.getByText(/Ya has creado una tienda con este numero/i)).toBeInTheDocument();
    });
  });

  it('debería registrarse vía email correctamente', async () => {
    render(<SignUpForm onSwitchToSignIn={mockOnSwitch} />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByText(/O USAR EMAIL/i));

    fireEvent.change(screen.getByPlaceholderText(/tu@correo.com/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /crear mi tienda/i }));

    await waitFor(() => {
      expect(getSupabase().auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('debería completar signup WhatsApp y mostrar los códigos de respaldo', async () => {
    render(<SignUpForm onSwitchToSignIn={mockOnSwitch} />, { wrapper: MemoryRouter });
    fillForm('70000001');
    fireEvent.click(screen.getByRole('button', { name: /crear mi tienda/i }));

    await waitFor(() => {
      // Backup codes modal should show codes returned by orchestrate-signup
      expect(screen.getByText('CODE1')).toBeInTheDocument();
      expect(screen.getByText('CODE2')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify orchestrate-signup was called (not auth.signUp)
    expect(getSupabase().functions.invoke).toHaveBeenCalledWith('orchestrate-signup', {
      body: { phone: '+50570000001', password: 'password123' },
    });

    // Verify shadow email login was called
    expect(getSupabase().auth.signInWithPassword).toHaveBeenCalledWith({
      email: '50570000001@tiender.app',
      password: 'password123',
    });
  });

  it('debería navegar al dashboard si no se generan códigos de respaldo', async () => {
    (getSupabase().functions.invoke as Mock).mockImplementation(async (functionName) => {
      if (functionName === 'orchestrate-signup') {
        return {
          data: { success: true, user_id: 'test-user-id', backup_codes: null },
          error: null,
        };
      }
    });

    render(<SignUpForm onSwitchToSignIn={mockOnSwitch} />, { wrapper: MemoryRouter });
    fillForm('70000002');
    fireEvent.click(screen.getByRole('button', { name: /crear mi tienda/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});

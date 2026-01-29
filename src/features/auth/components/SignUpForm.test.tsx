import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// Import the client which will now be mocked
import { supabase } from '../../../lib/supabaseClient';

describe('SignUpForm', () => {
  const mockOnSwitch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: {
        user: { id: 'test-user-id' },
        session: { access_token: 'test-access-token' }
      },
      error: null,
    });
    
    vi.mocked(supabase.functions.invoke).mockImplementation(async (functionName) => {
      if (functionName === 'generate-backup-codes') {
        return Promise.resolve({
          data: { plain_codes: ['code1', 'code2'] },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: new Error('Unknown function') });
    });
  });

  const generateRandomPhone = () => {
    const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
    return `+505${randomNumber}`;
  }

  const fillForm = (whatsapp = generateRandomPhone()) => {
    fireEvent.change(screen.getByLabelText(/número de whatsapp/i), { target: { value: whatsapp } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } });
  };

  it('debería renderizar los campos y el botón', () => {
    render(<SignUpForm onSwitchToSignIn={mockOnSwitch} />, { wrapper: MemoryRouter });
    expect(screen.getByLabelText(/número de whatsapp/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument();
  });

  it('debería mostrar un error si el registro falla', async () => {
    // Mock failing signup response for this specific test
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'User already registered' },
    });

    render(<SignUpForm onSwitchToSignIn={mockOnSwitch} />, { wrapper: MemoryRouter });

    // Use a random number; the mock controls the outcome.
    fillForm(generateRandomPhone());

    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(screen.getByText(/user already registered/i)).toBeInTheDocument();
    });
  });
});

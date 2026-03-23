import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SignInForm from './SignInForm';

vi.mock('../../../lib/supabaseClient', () => {
  const mockAuth = {
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
  };
  return {
    getSupabase: vi.fn(() => ({ auth: mockAuth })),
  };
});

import { getSupabase } from '../../../lib/supabaseClient';

describe('SignInForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render email, password inputs and a submit button', () => {
    render(
      <MemoryRouter>
        <SignInForm />
      </MemoryRouter>
    );

    const phoneInput = screen.getByPlaceholderText(/Número de WhatsApp o Email/i);
    expect(phoneInput).toBeInTheDocument();

    const passwordInput = screen.getByPlaceholderText(/Tu Contraseña/i);
    expect(passwordInput).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: /Entrar a mi Tienda/i });
    expect(submitButton).toBeInTheDocument();
  });

  it('should transform phone number to shadow email during login', async () => {
    render(
      <MemoryRouter>
        <SignInForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Número de WhatsApp o Email/i), { target: { value: '+505 8888 8888' } });
    fireEvent.change(screen.getByPlaceholderText(/Tu Contraseña/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Entrar a mi Tienda/i }));

    await waitFor(() => {
      expect(getSupabase().auth.signInWithPassword).toHaveBeenCalledWith({
        email: '50588888888@tiender.app',
        password: 'password123'
      });
    });
  });

  it('should NOT transform email to shadow email during login', async () => {
    render(
      <MemoryRouter>
        <SignInForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Número de WhatsApp o Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Tu Contraseña/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Entrar a mi Tienda/i }));

    await waitFor(() => {
      expect(getSupabase().auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });
});

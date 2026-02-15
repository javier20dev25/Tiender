// src/features/auth/AuthFlow.test.tsx
// Tests the sign-up flow: form submission → backup codes modal.
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { SignUpForm } from './components/SignUpForm';

// --- Mock Data ---
const testPhone = '+50570000001';
const mockUser = { id: 'user-123', phone: testPhone, email: '' };
const mockSession = { user: mockUser, access_token: 'token', expires_in: 3600, refresh_token: 'ref', token_type: 'bearer' };

// --- Mock getSupabase ---
const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockFunctionsInvoke = vi.fn();

vi.mock('../../lib/supabaseClient', () => ({
  getSupabase: vi.fn(() => ({
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignInWithPassword,
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    functions: { invoke: mockFunctionsInvoke },
  })),
}));

// Mock html2canvas since it's used for downloading backup codes
vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: vi.fn().mockReturnValue('data:image/png;base64,fake'),
  }),
}));

describe('Authentication Flow Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSignUp.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    mockSignInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    mockFunctionsInvoke.mockResolvedValue({
      data: { plain_codes: ['code-abc-123', 'code-def-456'] },
      error: null,
    });
  });

  test('should allow a new user to sign up and see the backup codes modal', async () => {
    const onSwitchToSignIn = vi.fn();

    render(
      <MemoryRouter>
        <SignUpForm onSwitchToSignIn={onSwitchToSignIn} />
      </MemoryRouter>
    );

    // The form defaults to WhatsApp mode
    const phoneInput = screen.getByLabelText(/número de whatsapp/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);

    expect(phoneInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();

    // Fill out and submit the sign-up form
    fireEvent.change(phoneInput, { target: { value: testPhone } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    // Assert that the backup codes modal appears with the codes
    await waitFor(() => {
      expect(screen.getByText('code-abc-123')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify the correct Supabase calls were made
    expect(mockSignUp).toHaveBeenCalledWith({
      phone: testPhone,
      password: 'password123',
    });

    expect(mockFunctionsInvoke).toHaveBeenCalledWith('generate-backup-codes', {
      body: { userId: mockUser.id },
    });
  });

  test('should switch to email mode and sign up with email', async () => {
    const onSwitchToSignIn = vi.fn();

    render(
      <MemoryRouter>
        <SignUpForm onSwitchToSignIn={onSwitchToSignIn} />
      </MemoryRouter>
    );

    // Click the toggle to switch to email mode
    fireEvent.click(screen.getByText(/o usa tu correo electrónico/i));

    // Now email input should be visible
    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    // Verify signUp was called with email credentials
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
});
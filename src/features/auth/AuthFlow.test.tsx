// src/features/auth/AuthFlow.test.tsx
// Tests the sign-up flow: form submission → backup codes modal.
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
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

    // orchestrate-signup now returns backup_codes atomically
    mockFunctionsInvoke.mockImplementation(async (functionName) => {
      if (functionName === 'orchestrate-signup') {
        return { data: { success: true, user_id: mockUser.id, backup_codes: ['code-abc-123', 'code-def-456'] }, error: null };
      }
      if (functionName === 'generate-backup-codes') {
        return { data: { plain_codes: ['code-abc-123', 'code-def-456'] }, error: null };
      }
    });

    render(
      <MemoryRouter>
        <SignUpForm onSwitchToSignIn={onSwitchToSignIn} />
      </MemoryRouter>
    );

    const phoneInput = screen.getByPlaceholderText(/8888 8888/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);

    expect(phoneInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();

    fireEvent.change(phoneInput, { target: { value: '70000001' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /crear mi tienda/i }));

    // Assert that the backup codes modal appears with the codes
    await waitFor(() => {
      expect(screen.getByText('code-abc-123')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify the correct Edge Function call was made
    expect(mockFunctionsInvoke).toHaveBeenCalledWith('orchestrate-signup', {
      body: { phone: '+50570000001', password: 'password123' },
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
    fireEvent.click(screen.getByText(/O USAR EMAIL/i));

    // Now email input should be visible
    const emailInput = screen.getByPlaceholderText(/tu@correo.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /crear mi tienda/i }));

    // Verify signUp was called with email credentials
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
});
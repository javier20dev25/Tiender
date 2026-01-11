
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

// Mocking supabase client
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

const mockSession: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  user: {
    id: 'mock-user-id',
    email: 'test@example.com',
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
  },
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
};

const TestComponent = () => {
  const { user, session, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div data-testid="user">{user ? user.email : 'No User'}</div>
      <div data-testid="session">{session ? 'Has Session' : 'No Session'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.mocked(supabase.auth.getSession).mockClear();
    vi.mocked(supabase.auth.onAuthStateChange).mockClear();
  });

  it('should provide user and session when authenticated', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    expect(screen.getByTestId('session')).toHaveTextContent('Has Session');
  });

  it('should provide null user and session when not authenticated', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId('user')).toHaveTextContent('No User');
    expect(screen.getByTestId('session')).toHaveTextContent('No Session');
  });

  it('should show loading state initially', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should update auth state on onAuthStateChange', async () => {
    // Initial state is null
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    let onAuthStateChangeCallback: (event: string, session: Session | null) => void;

    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      onAuthStateChangeCallback = callback;
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      };
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    // Still no user
    expect(screen.getByTestId('user')).toHaveTextContent('No User');
    
    // Simulate auth state change
    await act(async () => {
      onAuthStateChangeCallback('SIGNED_IN', mockSession);
    });
    
    // Now we have a user
    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
  });

  // it('should throw an error if useAuth is used outside of AuthProvider', () => {
  //   // Hide console.error for this test
  //   const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  //   const BrokenComponent = () => {
  //     useAuth();
  //     return null;
  //   }
    
  //   expect(() => render(<BrokenComponent />)).toThrow();

  //   expect(consoleErrorSpy).toHaveBeenCalled();
    
  //   consoleErrorSpy.mockRestore();
  // });
});

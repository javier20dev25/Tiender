import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { getSupabase } from '../lib/supabaseClient'; // Import to be mocked
import type { Session } from '@supabase/supabase-js';

// --- MOCKING supabaseClient ---
// This is a full, local, self-contained mock for the supabase client.
// It solves the test suite's core problem by not relying on a broken global setup.
vi.mock('../lib/supabaseClient', () => {
  const from = vi.fn().mockReturnThis();
  const select = vi.fn().mockReturnThis();
  const eq = vi.fn().mockReturnThis();
  const single = vi.fn().mockResolvedValue({ data: { id: 'store-123', plan_type: 'full' }, error: null });

  const getSession = vi.fn();
  const onAuthStateChange = vi.fn((_event, callback) => {
    // Proporciona una implementación por defecto que siempre devuelve la estructura esperada
    if (callback) {
      callback('INITIAL_SESSION', null);
    }
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });

  return {
    supabase: {
      auth: {
        getSession,
        onAuthStateChange,
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: single,
          })),
        })),
      })),
    },
  };
});


// --- TEST SETUP ---
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
  const { user, session, loading, store } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div data-testid="user">{user ? user.email : 'No User'}</div>
      <div data-testid="session">{session ? 'Has Session' : 'No Session'}</div>
      <div data-testid="store">{store ? `Store: ${store.id}` : 'No Store'}</div>
    </div>
  );
};

describe('AuthContext', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide user, session, and store when authenticated', async () => {
    (getSupabase().auth.getSession as Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('session')).toHaveTextContent('Has Session');
      expect(screen.getByTestId('store')).toHaveTextContent('Store: store-123');
    });
  });

  it('should provide null user and session when not authenticated', async () => {
    (getSupabase().auth.getSession as Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
      expect(screen.getByTestId('session')).toHaveTextContent('No Session');
      expect(screen.getByTestId('store')).toHaveTextContent('No Store');
    });
  });

  it('should show loading state initially', () => {
    (getSupabase().auth.getSession as Mock).mockResolvedValue({ data: { session: null }, error: null });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should update auth state on onAuthStateChange', async () => {
    (getSupabase().auth.getSession as Mock).mockResolvedValue({ data: { session: null }, error: null });

    let onAuthStateChangeCallback: (event: string, session: Session | null) => void;

    (getSupabase().auth.onAuthStateChange as Mock).mockImplementation((callback) => {
      onAuthStateChangeCallback = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('No User'));

    await act(async () => {
      onAuthStateChangeCallback('SIGNED_IN', mockSession);
    });
    
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('test@example.com'));
  });
});
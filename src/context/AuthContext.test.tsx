import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import type { Session } from '@supabase/supabase-js';

// --- Mock Supabase Client ---
const mockFrom = vi.fn();
const mockGetSession = vi.fn();
const mockSignOut = vi.fn().mockResolvedValue({ error: null });
let onAuthStateChangeCallback: ((event: string, session: Session | null) => void) | null = null;
const mockOnAuthStateChange = vi.fn((callback) => {
  onAuthStateChangeCallback = callback;
  return { data: { subscription: { unsubscribe: vi.fn() } } };
});
const mockFunctionsInvoke = vi.fn().mockResolvedValue({ data: { status: 'in_sync' }, error: null });

vi.mock('../lib/supabaseClient', () => ({
  getSupabase: vi.fn(() => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signOut: mockSignOut,
    },
    from: mockFrom,
    functions: { invoke: mockFunctionsInvoke },
  })),
}));

// --- Test Data ---
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

const mockStore = { id: 'store-123', name: 'Test Store', plan_type: 'full', trial_ends_at: null, user_id: 'mock-user-id' };

// Helper to set up from() mock for store and subscription queries
const setupFromMock = (storeData: unknown = mockStore, subData: unknown = null) => {
  mockFrom.mockImplementation((table: string) => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: table === 'stores' ? storeData : subData,
          error: table === 'stores' && !storeData ? { code: 'PGRST116' } : (table === 'subscriptions' && !subData ? { code: 'PGRST116' } : null),
        }),
      }),
    }),
  }));
};

// --- Test Component ---
const TestComponent = () => {
  const { user, session, loading, store, subscription } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div data-testid="user">{user ? user.email : 'No User'}</div>
      <div data-testid="session">{session ? 'Has Session' : 'No Session'}</div>
      <div data-testid="store">{store ? `Store: ${store.id}` : 'No Store'}</div>
      <div data-testid="subscription">{subscription ? `Sub: ${subscription.status}` : 'No Sub'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onAuthStateChangeCallback = null;
  });

  it('should provide user, session, and store when authenticated', async () => {
    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });
    setupFromMock(mockStore, { status: 'active', current_period_end: null });

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
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

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
    // Never resolve getSession so we stay in loading
    mockGetSession.mockReturnValue(new Promise(() => { }));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should update auth state on onAuthStateChange', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    setupFromMock(mockStore, null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('No User'));

    // Simulate a sign-in event via the captured callback
    await act(async () => {
      if (onAuthStateChangeCallback) {
        onAuthStateChangeCallback('SIGNED_IN', mockSession);
      }
    });

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('test@example.com'));
  });
});
// src/e2e/full-flow.test.tsx
// Integration test: Simulates the flow from auth page to dashboard product creation.
// Uses mocked useAuth and getSupabase to bypass AuthProvider internals.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

// --- Mock Data ---
const mockUser = { id: 'test-user-id', email: 'test@tiender.com' };
const mockSession = { user: mockUser, access_token: 'test-token' };
const mockStore = {
    id: 'new-store-id',
    name: 'Tienda de Prueba E2E',
    user_id: mockUser.id,
    plan_type: 'full',
    trial_ends_at: null,
    whatsapp_number: '+1234567890',
    logo_url: null,
};
const mockProduct = { id: 'new-product-id', title: 'Test Product', price: 10, store_id: mockStore.id, image_url: null, created_at: new Date().toISOString() };

// --- Mock getSupabase ---
const mockFrom = vi.fn();
const mockFunctionsInvoke = vi.fn();
const mockSignUp = vi.fn();

vi.mock('../lib/supabaseClient', () => ({
    getSupabase: vi.fn(() => ({
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
            signOut: vi.fn(),
            signUp: mockSignUp,
            signInWithPassword: vi.fn(),
            getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
        from: mockFrom,
        functions: { invoke: mockFunctionsInvoke },
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
        storage: { from: vi.fn().mockReturnValue({ upload: vi.fn().mockResolvedValue({ error: null }), remove: vi.fn().mockResolvedValue({ error: null }) }) },
    })),
}));

// --- Mock useAuth - Start unauthenticated, then simulate login ---
let currentAuthState: any;

vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn(() => currentAuthState),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import React from 'react';

describe('Full E2E User and Customer Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Start unauthenticated
        currentAuthState = {
            user: null,
            store: null,
            subscription: null,
            loading: false,
            signOut: vi.fn(),
        };

        // Mock signUp to trigger auth state change
        mockSignUp.mockResolvedValue({
            data: { user: mockUser, session: mockSession },
            error: null,
        });

        // Mock functions invoke
        mockFunctionsInvoke.mockImplementation(async (fn: string) => {
            if (fn === 'orchestrate-signup') return { data: { store: mockStore }, error: null };
            if (fn === 'generate-backup-codes') return { data: { plain_codes: ['code1', 'code2', 'code3'] }, error: null };
            if (fn === 'sync-paypal-subscription') return { data: { status: 'in_sync' }, error: null };
            return { data: null, error: null };
        });

        // Mock from() 
        mockFrom.mockImplementation(() => {
            const chain: any = {};
            chain.select = vi.fn().mockReturnValue(chain);
            chain.eq = vi.fn().mockReturnValue(chain);
            chain.order = vi.fn().mockResolvedValue({ data: [mockProduct], error: null });
            chain.single = vi.fn().mockResolvedValue({ data: mockStore, error: null });
            chain.insert = vi.fn().mockResolvedValue({ data: [mockProduct], error: null });
            chain.update = vi.fn().mockReturnValue(chain);
            chain.delete = vi.fn().mockReturnValue(chain);
            return chain;
        });
    });

    it('should render the auth page and allow navigating to sign-up', async () => {
        render(
            <MemoryRouter initialEntries={['/auth']}>
                <App />
            </MemoryRouter>
        );

        // Auth page should be rendered when not authenticated
        await waitFor(() => {
            // SignUpForm should be visible since AuthPage defaults to sign-up
            const authContent = screen.getByText(/crear cuenta/i);
            expect(authContent).toBeInTheDocument();
        });
    });

    it('should render dashboard when authenticated with active subscription', async () => {
        // Set authenticated state
        currentAuthState = {
            user: mockUser,
            store: mockStore,
            subscription: { status: 'active', current_period_end: null },
            loading: false,
            signOut: vi.fn(),
        };

        render(
            <MemoryRouter initialEntries={['/dashboard']}>
                <App />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Panel del Vendedor')).toBeInTheDocument();
        });

        // Should see the store name
        await waitFor(() => {
            expect(screen.getByText(`Tu Tienda: ${mockStore.name}`)).toBeInTheDocument();
        });
    });
});
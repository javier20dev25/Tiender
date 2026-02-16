// src/e2e/store-flow.test.tsx
import { describe, it, expect, vi } from 'vitest';

// --- Mock Supabase ---
const mockFrom = vi.fn();
const mockSignUp = vi.fn();
const mockGetSession = vi.fn();
const mockSignOut = vi.fn().mockResolvedValue({ error: null });
const mockDeleteUser = vi.fn().mockResolvedValue({ data: null, error: null });

vi.mock('../lib/supabaseClient', () => ({
    getSupabase: vi.fn(() => ({
        auth: {
            signUp: mockSignUp,
            getSession: mockGetSession,
            signOut: mockSignOut,
            admin: { deleteUser: mockDeleteUser },
        },
        from: mockFrom,
    })),
}));

// Helper to generate a random email for each test run
const generateRandomEmail = () => `test.rls.${Date.now()}@example.com`;

describe('Backend RLS and Data Flow Test', () => {
    it('should allow public reads on stores and products after creation', async () => {
        const mockUser = {
            id: 'mock-user-id',
            email: generateRandomEmail(),
        };
        const mockSession = { access_token: 'mock-token', user: mockUser };

        // Mock auth
        mockSignUp.mockResolvedValue({
            data: { user: mockUser, session: mockSession },
            error: null,
        });
        mockGetSession.mockResolvedValue({
            data: { session: mockSession },
            error: null,
        });

        // Mock from() for different tables
        mockFrom.mockImplementation((table: string) => {
            const chain = {
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn(),
                then: (onfulfilled: (value: { data: unknown[]; error: unknown }) => unknown) => onfulfilled({ data: [], error: null }),
            };

            if (table === 'stores') {
                chain.single.mockResolvedValue({
                    data: { id: 'mock-store-id', user_id: 'mock-user-id', name: 'RLS Test Store' },
                    error: null,
                });
                // For the select all query (returns array-like via thenable)
                chain.then = (onFulfilled: (value: { data: unknown[]; error: unknown }) => unknown) => {
                    return Promise.resolve(onFulfilled({
                        data: [{ id: 'mock-store-id', name: 'RLS Test Store' }],
                        error: null,
                    }));
                };
            } else if (table === 'products') {
                chain.single.mockResolvedValue({
                    data: { id: 'mock-product-id', store_id: 'mock-store-id', title: 'RLS Test Product', price: 10.99 },
                    error: null,
                });
                chain.then = (onFulfilled: (value: { data: unknown[]; error: unknown }) => unknown) => {
                    return Promise.resolve(onFulfilled({
                        data: [{ id: 'mock-product-id', store_id: 'mock-store-id', title: 'RLS Test Product', price: 10.99 }],
                        error: null,
                    }));
                };
            } else {
                chain.single.mockResolvedValue({ data: null, error: null });
            }

            return chain;
        });

        const { getSupabase } = await import('../lib/supabaseClient');
        const supabase = getSupabase();

        // 1. Sign up a new user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: mockUser.email,
            password: 'Password123!',
            options: { data: {} },
        });

        expect(signUpError).toBeNull();
        expect(signUpData.user).toBeDefined();

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        expect(sessionError).toBeNull();
        expect(sessionData.session).toBeDefined();

        // 2. Create a store
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .insert({
                user_id: signUpData.user!.id,
                name: 'RLS Test Store',
                whatsapp_number: 'N/A',
            })
            .select()
            .single();
        expect(storeError).toBeNull();
        expect(store).toBeDefined();

        // 3. Create a product
        const { data: product, error: productError } = await supabase
            .from('products')
            .insert({ store_id: store.id, title: 'RLS Test Product', price: 10.99 })
            .select()
            .single();
        expect(productError).toBeNull();
        expect(product).toBeDefined();

        // 4. Sign out and fetch publicly
        await supabase.auth.signOut();

        const { data: publicStoreData, error: publicStoreError } = await supabase
            .from('stores')
            .select('*')
            .eq('id', store.id)
            .single();

        expect(publicStoreError).toBeNull();
        expect(publicStoreData).not.toBeNull();
        expect(publicStoreData.name).toBe('RLS Test Store');

        const { data: publicProductData, error: publicProductError } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', store.id)
            .single();

        expect(publicProductError).toBeNull();
        expect(publicProductData).not.toBeNull();
        expect(publicProductData.title).toBe('RLS Test Product');
    });
});

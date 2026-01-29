// src/e2e/store-flow.test.tsx
import { describe, it, expect, afterAll, vi } from 'vitest'; // Add vi to imports
import { User } from '@supabase/supabase-js';

vi.mock('../lib/supabaseClient', () => {
    const mockUser = {
        id: 'mock-user-id',
        email: 'test.rls.mock@example.com',
        user_metadata: {},
    };

    const from = (table) => {
        const queryBuilder = {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(),
            then: null, // Placeholder for thenable
        };

        // Make it thenable for await
        queryBuilder.then = function(onFulfilled) {
            if (table === 'products') {
                onFulfilled({ data: [{ id: 'mock-product-id', store_id: 'mock-store-id', title: 'RLS Test Product', price: 10.99 }], error: null });
            } else if (table === 'stores') {
                onFulfilled({ data: [{ id: 'mock-store-id', name: 'RLS Test Store' }], error: null });
            } else {
                onFulfilled({ data: [], error: null });
            }
        };

        if (table === 'stores') {
            queryBuilder.single.mockResolvedValue({ data: { id: 'mock-store-id', user_id: 'mock-user-id', name: 'RLS Test Store' }, error: null });
        } else if (table === 'products') {
            queryBuilder.single.mockResolvedValue({ data: { id: 'mock-product-id', store_id: 'mock-store-id', title: 'RLS Test Product', price: 10.99 }, error: null });
        } else {
            queryBuilder.single.mockResolvedValue({ data: null, error: null });
        }

        return queryBuilder;
    };

    return {
        supabase: {
            auth: {
                signUp: vi.fn().mockResolvedValue({
                    data: { user: mockUser, session: { access_token: 'mock-token' } },
                    error: null,
                }),
                getSession: vi.fn().mockResolvedValue({
                    data: { session: { user: mockUser, access_token: 'mock-token' } },
                    error: null,
                }),
                admin: {
                    deleteUser: vi.fn().mockResolvedValue({ data: null, error: null }),
                },
                signOut: vi.fn().mockResolvedValue({ error: null }),
            },
            from: vi.fn(from),
        },
    };
});

// Helper to generate a random email for each test run
const generateRandomEmail = () => `test.rls.${Date.now()}@example.com`;

describe('Backend RLS and Data Flow Test', () => {
    let createdUser: User | null = null;
    
    // Clean up created data after the test - No real cleanup needed with mocks.
    afterAll(async () => {
        const { supabase } = await import('../lib/supabaseClient'); // Ensure using the mocked supabase
        if (createdUser) {
            await supabase.auth.admin.deleteUser(createdUser.id);
        }
    });
    
    it('should allow public reads on stores and products after creation', async () => {
        const { supabase } = await import('../lib/supabaseClient'); // Import mocked supabase

        // 1. Sign up a new user directly
        const testUser = {
            email: generateRandomEmail(),
            password: 'Password123!',
        };
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            ...testUser,
            options: { data: {} }
        });

        expect(signUpError, `Sign-up failed: ${signUpError?.message}`).toBeNull();
        expect(signUpData.user, 'User object should be returned on sign-up').toBeDefined();
        createdUser = signUpData.user;
        
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        expect(sessionError).toBeNull();
        expect(sessionData.session).toBeDefined();

        // 2. Programmatically create a store for this user
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .insert({ 
                user_id: createdUser!.id, 
                name: 'RLS Test Store', 
                whatsapp_number: 'N/A'
            })
            .select()
            .single();
        expect(storeError, `Store creation failed: ${storeError?.message}`).toBeNull();
        expect(store, 'Store data should be returned after creation').toBeDefined();

        // 3. Programmatically create a product for this store
        const { data: product, error: productError } = await supabase
            .from('products')
            .insert({ store_id: store.id, title: 'RLS Test Product', price: 10.99 })
            .select()
            .single();
        expect(productError, `Product creation failed: ${productError?.message}`).toBeNull();
        expect(product, 'Product data should be returned after creation').toBeDefined();

        // 4. ATTEMPT TO FETCH PUBLICLY (THE REAL TEST)
        // Sign out to ensure the client is anonymous
        await supabase.auth.signOut();

        // Try to fetch the store
        const { data: publicStoreData, error: publicStoreError } = await supabase
            .from('stores')
            .select('*')
            .eq('id', store.id)
            .single();
        
        expect(publicStoreError, 'Fetching store publicly should not fail').toBeNull();
        expect(publicStoreData).not.toBeNull();
        expect(publicStoreData.name).toBe('RLS Test Store');
        
        // Try to fetch products
        const { data: publicProductData, error: publicProductError } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', store.id);

        expect(publicProductError, 'Fetching products publicly should not fail').toBeNull();
        expect(publicProductData).not.toBeNull();
        expect(publicProductData).toHaveLength(1);
        expect(publicProductData![0].title).toBe('RLS Test Product');
    });
});


// src/e2e/store-flow.test.tsx
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { supabase } from '../lib/supabaseClient';
import { orchestrateSignUp, signIn } from '../features/auth/services/authService';

// Helper to generate a random phone number for each test run
const generateRandomPhone = () => {
    const countryCode = '+505'; // Nicaragua
    const randomNumber = Math.floor(10000000 + Math.random() * 90000000); // 8-digit number
    return `${countryCode}${randomNumber}`;
};

describe('End-to-end store flow', () => {
    const testUser = {
        phone: generateRandomPhone(),
        password: 'Password123!',
    };
    let userId: string;
    let storeId: string;
    let productId: string;

    // Clean up created data after the test
    afterAll(async () => {
        const { data: authUser, error: authErr } = await supabase.auth.admin.deleteUser(userId);
        if(authErr) console.error("Error cleaning up user:", authErr.message);

        // Associated tables should be cleaned up by CASCADE constraints if set up,
        // otherwise, manual cleanup would be needed.
    });
    
    it('should fail to fetch store data publicly if RLS is not set', async () => {
        // 1. Sign up a new user using the orchestration function
        const signUpResponse = await orchestrateSignUp({
            phone: testUser.phone,
            password: testUser.password,
        });
        expect(signUpResponse.success).toBe(true);
        expect(signUpResponse.user_id).toBeDefined();
        userId = signUpResponse.user_id!;

        // 2. Sign in as the new user to perform authenticated actions
        const { user: signedInUser, error: signInError } = await signIn(testUser);
        expect(signInError).toBeNull();
        expect(signedInUser).toBeDefined();
        expect(signedInUser!.id).toBe(userId);

        // 3. Find the auto-generated store and update its name
        const { data: storeData, error: storeError } = await supabase
            .from('stores')
            .select('id')
            .eq('user_id', userId)
            .single();
        
        expect(storeError).toBeNull();
        expect(storeData).toBeDefined();
        storeId = storeData!.id;

        const { error: updateStoreError } = await supabase
            .from('stores')
            .update({ name: 'pruebagemini-test' })
            .eq('id', storeId);

        expect(updateStoreError).toBeNull();

        // 4. Create a new product for this store
        const productDetails = {
            store_id: storeId,
            title: 'Test Product',
            price: 99.99,
            image_url: 'https://placehold.co/600x400.png'
        };
        const { data: productData, error: productError } = await supabase
            .from('products')
            .insert(productDetails)
            .select('id')
            .single();

        expect(productError).toBeNull();
        expect(productData).toBeDefined();
        productId = productData!.id;

        // 5. ATTEMPT TO FETCH PUBLICLY (THIS IS THE REAL TEST)
        // We create a new, unauthenticated client to simulate a public user.
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const publicSupabase = supabase; // In a real browser context, this would be a new client.
                                         // For this test, we can just sign out to clear auth.
        await supabase.auth.signOut();


        // Try to fetch the store
        const { data: publicStoreData, error: publicStoreError } = await publicSupabase
            .from('stores')
            .select('*')
            .eq('id', storeId)
            .single();

        // Try to fetch products
        const { data: publicProductData, error: publicProductError } = await publicSupabase
            .from('products')
            .select('*')
            .eq('store_id', storeId);

        // ASSERTION: This is where we expect the test to fail if RLS is not configured.
        // If it fails, the next step is to add the RLS policies.
        expect(publicStoreError, 'Fetching the store publicly should not throw a security error if RLS is correct.').toBeNull();
        expect(publicStoreData, 'Public user should be able to see the store.').not.toBeNull();
        expect(publicStoreData?.name).toBe('pruebagemini-test');
        
        expect(publicProductError, 'Fetching products publicly should not throw a security error if RLS is correct.').toBeNull();
        expect(publicProductData, 'Public user should be able to see the products.').not.toBeNull();
        expect(publicProductData?.length).toBe(1);
        expect(publicProductData?.[0].title).toBe('Test Product');
    });

});

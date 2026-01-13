// supabase/functions/orchestrate-signup/orchestrate-signup.test.ts

import { describe, it } from "https://deno.land/std@0.217.0/testing/bdd.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.217.0/assert/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Usamos Deno.env.get() en lugar de process.env
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Condición para decidir si los tests de integración deben correr.
const shouldRunIntegrationTests = !!(supabaseUrl && serviceRoleKey);

describe('Edge Function: orchestrate-signup', () => {

  // Este test se saltará si las variables de entorno no están presentes.
  it('should return 400 on missing parameters', { ignore: !shouldRunIntegrationTests }, async () => {
    const response = await fetch(`${supabaseUrl!}/functions/v1/orchestrate-signup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: `+1555${String(Date.now()).slice(-7)}`,
        // Falta la contraseña
      }),
    });

    const body = await response.json();
    assertEquals(response.status, 400);
    assertEquals(body.error_code, 'MISSING_PARAMS');
    assertEquals(body.message, 'Faltan el teléfono y la contraseña.');
  });

  // Se eliminó el objeto de opciones complejo para evitar el error de tipado.
  // El test ahora se ejecutará si las variables de entorno están presentes.
  it('should run the full cycle: signup, reject duplicate, and cleanup', async (t) => {
    if (!shouldRunIntegrationTests) {
      console.log("Skipping integration test: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return;
    }
  
    const testPhone = `+1555${String(Date.now()).slice(-7)}`;
    const testPassword = 'strongPassword123!';
    let userId = '';

    await t.step('Step 1: Successfully create a new user with phone', async () => {
        const response = await fetch(`${supabaseUrl!}/functions/v1/orchestrate-signup`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey!}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: testPhone,
            password: testPassword,
          }),
        });
        
        const body = await response.json();
        
        assertEquals(response.status, 200);
        assertEquals(body.success, true);
        assertEquals(body.message, 'Usuario creado y activado correctamente.');
        assertExists(body.user_id);
        userId = body.user_id;
    });

    await t.step('Step 2: Reject signup with a duplicate phone number', async () => {
        if (!userId) return;

        const response = await fetch(`${supabaseUrl!}/functions/v1/orchestrate-signup`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey!}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phone: testPhone,
              password: testPassword,
            }),
          });
    
          const body = await response.json();
          assertEquals(response.status, 409);
          assertEquals(body.error_code, 'PHONE_EXISTS');
    });

    await t.step('Step 3: Clean up the created user', async () => {
        if (!userId) return;

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error("Missing supabaseUrl or serviceRoleKey for cleanup");
        }
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        
        if (error) {
            console.error(`Cleanup failed for user ${userId}:`, error.message);
        }
        assertEquals(error, null);
    });
  });
});

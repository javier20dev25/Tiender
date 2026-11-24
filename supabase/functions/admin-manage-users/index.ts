// supabase/functions/admin-manage-users/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const ADMIN_EMAILS = [
  'sleytherelax18@gmail.com',
  'sleytherjavier2025@gmail.com',
  'sleytherjavier74@gmail.com'
];

const isExcludedEmail = (email?: string | null) => {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return ADMIN_EMAILS.includes(clean) || clean.startsWith('sleyther');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Configuración incompleta en Supabase.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { action, payload } = await req.json();

    // ACTION: init (Ensure admin exists with credentials)
    if (action === 'init') {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const existingAdmin = users?.find(u => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());

      if (!existingAdmin) {
        await supabaseAdmin.auth.admin.createUser({
          email: ADMIN_EMAIL,
          password: 'SERPONGE777',
          email_confirm: true,
          user_metadata: { role: 'admin', is_admin: true }
        });
      } else {
        await supabaseAdmin.auth.admin.updateUserById(existingAdmin.id, {
          password: 'SERPONGE777',
          user_metadata: { ...existingAdmin.user_metadata, role: 'admin', is_admin: true }
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Administrador configurado correctamente.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: list
    if (action === 'list') {
      const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      if (usersError) throw usersError;

      const { data: stores, error: storesError } = await supabaseAdmin
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (storesError) throw storesError;

      const userList = (usersData?.users || [])
        .filter(u => !isExcludedEmail(u.email))
        .map(u => {
          const userStore = stores?.find(s => s.user_id === u.id);
          const rawPhone = u.user_metadata?.phone || u.email?.split('@')[0] || '';
          return {
            id: u.id,
            email: u.email,
            phone: rawPhone,
            created_at: u.created_at,
            must_change_password: u.user_metadata?.must_change_password ?? true,
            store: userStore ? {
              id: userStore.id,
              name: userStore.name,
              slug: userStore.slug,
              plan_type: userStore.plan_type,
              billing_exempt: userStore.plan_type === 'full' || (userStore.trial_ends_at ? new Date(userStore.trial_ends_at).getFullYear() >= 2030 : false),
              whatsapp_number: userStore.whatsapp_number,
              created_at: userStore.created_at
            } : null
          };
        });

      return new Response(JSON.stringify({ success: true, users: userList }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: create
    if (action === 'create') {
      const { phone, storeName, password } = payload || {};
      if (!phone || !password || !storeName) {
        return new Response(JSON.stringify({ error: 'Teléfono, nombre de tienda y contraseña requeridos.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const normalizedPhone = String(phone).replace(/\D/g, '');
      const fakeEmail = `${normalizedPhone}@tiender.app`;

      // 1. Crear el usuario en auth.users (usando shadow email)
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: fakeEmail,
        password: String(password).trim(),
        email_confirm: true,
        user_metadata: {
          phone: normalizedPhone,
          must_change_password: true,
          created_by_admin: true
        }
      });

      if (createError) {
        return new Response(JSON.stringify({ error: `Error creando auth user: ${createError.message}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const user = createData?.user;
      if (!user) {
        return new Response(JSON.stringify({ error: 'No se pudo generar el usuario en Auth.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 2. Crear identidad de WhatsApp si la tabla existe (opcional / no bloqueante)
      try {
        await supabaseAdmin.from('whatsapp_identities').upsert({
          whatsapp_number: normalizedPhone,
          status: 'TRIAL_ACTIVE',
          associated_auth_user_id: user.id
        }, { onConflict: 'whatsapp_number' });
      } catch (wErr) {
        console.warn('Advertencia creando whatsapp_identities:', wErr);
      }

      // 3. Crear la tienda con plan full y trial extendido a 5 años
      const cleanStoreName = String(storeName).trim();
      const slug = cleanStoreName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + user.id.substring(0, 6);

      const trialEnds = new Date();
      trialEnds.setFullYear(trialEnds.getFullYear() + 5); // 5 years

      const { data: store, error: storeError } = await supabaseAdmin.from('stores').insert({
        user_id: user.id,
        name: cleanStoreName,
        slug,
        whatsapp_number: normalizedPhone,
        plan_type: 'full',
        trial_ends_at: trialEnds.toISOString(),
      }).select().single();

      if (storeError) {
        // Rollback user if store creation fails
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        return new Response(JSON.stringify({ error: `Error creando tienda en base de datos: ${storeError.message || JSON.stringify(storeError)}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        user: {
          id: user.id,
          phone: normalizedPhone,
          email: fakeEmail,
          store,
          must_change_password: true
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: update-password
    if (action === 'update-password') {
      const { userId, password } = payload || {};
      if (!userId || !password) {
        return new Response(JSON.stringify({ error: 'userId y password requeridos.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: String(password).trim(),
        user_metadata: { must_change_password: false }
      });

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Contraseña actualizada.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: delete
    if (action === 'delete') {
      const { userId } = payload || {};
      if (!userId) {
        return new Response(JSON.stringify({ error: 'ID de usuario requerido.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 1. Eliminar tienda y productos asociados
      await supabaseAdmin.from('products').delete().match({ user_id: userId });
      await supabaseAdmin.from('stores').delete().match({ user_id: userId });
      await supabaseAdmin.from('whatsapp_identities').delete().match({ associated_auth_user_id: userId });

      // 2. Eliminar usuario de Auth
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({ success: true, message: 'Usuario y tienda eliminados.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Acción no reconocida.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : (typeof err === 'object' && err !== null ? JSON.stringify(err) : String(err));
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

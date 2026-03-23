import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';

// Load production environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.prod') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing in .env.prod');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const SESSION_FILE = resolve(process.cwd(), '.session.json');

function saveSession(session: unknown) {
  fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
}

function loadSession() {
  if (fs.existsSync(SESSION_FILE)) {
    return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
  }
  return null;
}

async function getAuthenticatedClient() {
  const sessionData = loadSession();
  if (!sessionData) {
    throw new Error('No active session. Please run: login <email> <password>');
  }
  
  // Set the session in the client
  const { error } = await supabase.auth.setSession({
    access_token: sessionData.access_token,
    refresh_token: sessionData.refresh_token
  });
  
  if (error) throw error;
  return supabase;
}

function parseFlags(args: string[]) {
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const value = args[i + 1];
      if (value && !value.startsWith('--')) {
        flags[key] = value;
        i++;
      } else {
        flags[key] = 'true';
      }
    }
  }
  return flags;
}

async function uploadImage(bucket: string, storeId: string, localPath: string) {
  if (!fs.existsSync(localPath)) {
    throw new Error(`File not found: ${localPath}`);
  }
  const fileBuffer = fs.readFileSync(localPath);
  const fileName = `${Date.now()}_${localPath.split(/[\\/]/).pop()}`;
  const filePath = `${storeId}/${fileName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType: 'image/jpeg'
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return publicUrl;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    console.log(`
Tiender CLI - Management Tool (Human & Agent Friendly)
Usage:
  npx tsx scripts/tiender.ts <command> [args] [flags]

Commands:
  login <email> <password>    Login and save session
  whoami                      Check active session and store details
  signup <phone> <email> <password> <storeName>
                              Create a new account and store
  update-store [--name "New Name"] [--logo "./path/to/logo.png"]
                              Update store identity
  finalize                    Get public store link
  
  add-product --title "Name" --price 10 [--image "./img.png"]
                              Add a new product
  list-products               List all products in the store
  get-product <id>            Show detailed product info
  edit-product <id> [--title "..." --price 123 --image "..."]
                              Modify product details
  delete-product <id>         Remove a product
  
  metrics                     View store visits and engagement
  sync <email> <password>     Sync PayPal subscription
  store <userId>              Fetch raw store data
  list-buckets               (Internal) List storage buckets
    `);
    return;
  }

  try {
    switch (command) {
      case 'login': {
        let [identifier, password] = args.slice(1);
        if (!identifier || !password) throw new Error('Usage: login <email|phone> <password>');
        
        // If identifier is purely numeric, assume it's a phone and convert to internal email
        if (/^\d+$/.test(identifier)) {
          identifier = `${identifier}@tiender.app`;
        }

        console.log(`Attempting login for: ${identifier}...`);
        const { data, error } = await supabase.auth.signInWithPassword({ email: identifier, password });
        if (error) throw error;
        console.log('Login successful!');
        saveSession(data.session);
        console.log('Session saved to .session.json');
        break;
      }

      case 'whoami': {
        const client = await getAuthenticatedClient();
        const { data: { user } } = await client.auth.getUser();
        console.log('Logged in as:', user?.email);
        console.log('User ID:', user?.id);
        
        const { data: store } = await client
          .from('stores')
          .select('*')
          .eq('user_id', user?.id)
          .single();
        
        if (store) {
          console.log('Active Store:', store.name);
          console.log('Store ID:', store.id);
          console.log('Store Slug:', store.slug);
        } else {
          console.log('No store found for this user.');
        }
        break;
      }

      case 'update-store': {
        const flags = parseFlags(args.slice(1));
        const client = await getAuthenticatedClient();
        const { data: { user } } = await client.auth.getUser();
        
        const { data: store } = await client
          .from('stores')
          .select('id')
          .eq('user_id', user?.id)
          .single();
        
        if (!store) throw new Error('Store not found.');

        const updates: any = {};
        if (flags.name) updates.name = flags.name;
        if (flags.logo) {
          console.log('Uploading logo...');
          updates.logo_url = await uploadImage('store-logos', store.id, flags.logo);
          console.log('Logo uploaded:', updates.logo_url);
        }

        if (Object.keys(updates).length === 0) {
          throw new Error('No updates provided. Use --name or --logo');
        }

        const { error } = await client
          .from('stores')
          .update(updates)
          .eq('id', store.id);
        
        if (error) throw error;
        console.log('Store updated successfully!');
        break;
      }

      case 'add-product': {
        const flags = parseFlags(args.slice(1));
        if (!flags.title || !flags.price) {
          throw new Error('Usage: add-product --title "Name" --price 10 [--image "./path.png"] [--discount 10 --timer 30 --threshold 5 --wholesale 8 --desc "..." --link "..." --video "..."]');
        }

        const client = await getAuthenticatedClient();
        const { data: { user } } = await client.auth.getUser();
        const { data: store } = await client.from('stores').select('id').eq('user_id', user?.id).single();
        if (!store) throw new Error('Store not found.');

        let imageUrl = null;
        if (flags.image) {
          console.log('Uploading product image...');
          imageUrl = await uploadImage('product-images', store.id, flags.image);
          console.log('Image uploaded:', imageUrl);
        }

        const insertPayload: Record<string, string | number | null> = {
          store_id: store.id,
          title: flags.title,
          price: parseFloat(flags.price),
          image_url: imageUrl,
          description: flags.desc || null,
          external_link: flags.link || null,
          video_link: flags.video || null,
          discount_percentage: flags.discount ? parseInt(flags.discount) : null,
          discount_timer_seconds: flags.timer ? parseInt(flags.timer) : null,
          wholesale_threshold: flags.threshold ? parseInt(flags.threshold) : null,
          wholesale_price: flags.wholesale ? parseFloat(flags.wholesale) : null
        };

        const { data: product, error } = await client
          .from('products')
          .insert(insertPayload)
          .select()
          .single();

        if (error) throw error;
        console.log('Product added successfully!');
        console.log(JSON.stringify(product, null, 2));
        break;
      }

      case 'list-products': {
        const client = await getAuthenticatedClient();
        const { data: { user } } = await client.auth.getUser();
        const { data: store } = await client.from('stores').select('id').eq('user_id', user?.id).single();
        if (!store) throw new Error('Store not found.');

        const { data, error } = await client
          .from('products')
          .select('*')
          .eq('store_id', store.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        console.table(data);
        break;
      }

      case 'get-product': {
        const [id] = args.slice(1);
        if (!id) throw new Error('Usage: get-product <productId>');
        const client = await getAuthenticatedClient();
        const { data, error } = await client.from('products').select('*').eq('id', id).single();
        if (error) throw error;
        console.log(JSON.stringify(data, null, 2));
        break;
      }

      case 'edit-product': {
        const [id, ...rest] = args.slice(1);
        if (!id) throw new Error('Usage: edit-product <productId> [--title "..." --price 123 --image "..."]');
        const flags = parseFlags(rest);
        const client = await getAuthenticatedClient();
        
        const { data: product } = await client.from('products').select('store_id').eq('id', id).single();
        if (!product) throw new Error('Product not found.');

        const updates: any = {};
        if (flags.title) updates.title = flags.title;
        if (flags.price) updates.price = parseFloat(flags.price);
        if (flags.image) {
          console.log('Uploading new product image...');
          updates.image_url = await uploadImage('product-images', product.store_id, flags.image);
          console.log('Image updated:', updates.image_url);
        }

        if (Object.keys(updates).length === 0) {
          throw new Error('No updates provided.');
        }

        const { error } = await client.from('products').update(updates).eq('id', id);
        if (error) throw error;
        console.log('Product updated successfully!');
        break;
      }

      case 'delete-product': {
        const [id] = args.slice(1);
        if (!id) throw new Error('Usage: delete-product <productId>');
        const client = await getAuthenticatedClient();
        const { error } = await client.from('products').delete().eq('id', id);
        if (error) throw error;
        console.log('Product deleted.');
        break;
      }

      case 'finalize': {
        const client = await getAuthenticatedClient();
        const { data: { user } } = await client.auth.getUser();
        const { data: store } = await client.from('stores').select('slug').eq('user_id', user?.id).single();
        if (!store) throw new Error('Store not found.');

        const baseUrl = 'https://tiender-bsi4w13hr-javier20dev25s-projects.vercel.app';
        console.log('--- STORE FINALIZED ---');
        console.log(`Public URL: ${baseUrl}/s/${store.slug}`);
        break;
      }

      case 'store': {
        const [userId] = args.slice(1);
        if (!userId) throw new Error('Usage: store <userId>');
        console.log(`Fetching store for userId: ${userId}...`);
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('user_id', userId)
          .single();
        if (error) throw error;
        console.log('Store Data:', JSON.stringify(data, null, 2));
        break;
      }

      case 'list-stores': {
        console.log('Fetching last 5 stores...');
        const { data, error } = await supabase
          .from('stores')
          .select('id, name, slug, user_id, created_at, plan_type')
          .order('created_at', { ascending: false })
          .limit(5);
        if (error) throw error;
        console.table(data);
        break;
      }

      case 'signup': {
        const [phone, email, password, storeName] = args.slice(1).filter(a => !a.startsWith('--'));
        const flags = parseFlags(args.slice(1));
        
        if (!phone || !email || !password || !storeName) {
          throw new Error('Usage: signup <phone> <email> <password> <storeName> [--plan standard|full]');
        }
        console.log('Invoking orchestrate-signup...');
        const { data, error } = await supabase.functions.invoke('orchestrate-signup', {
          body: { 
            phone, 
            password, 
            recovery_email: email, 
            storeName,
            selectedPlan: flags.plan || 'standard'
          }
        });
        if (error) {
          console.error('Edge Function Error:', error);
          throw error;
        }
        console.log('Signup Result:', JSON.stringify(data, null, 2));
        break;
      }

      case 'sync': {
        const [email, password] = args.slice(1);
        if (!email || !password) throw new Error('Usage: sync <email> <password> (Needs auth to invoke as user)');
        
        console.log('Logging in to get session...');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;

        console.log('Invoking sync-paypal-subscription...');
        const { data, error } = await supabase.functions.invoke('sync-paypal-subscription', {
          headers: { Authorization: `Bearer ${authData.session?.access_token}` }
        });
        if (error) throw error;
        console.log('Sync Result:', JSON.stringify(data, null, 2));
        break;
      }

      case 'metrics': {
        const client = await getAuthenticatedClient();
        const { data: { user } } = await client.auth.getUser();
        const { data: store, error: storeError } = await client.from('stores').select('id, name').eq('user_id', user?.id).single();
        if (storeError || !store) throw new Error('Store not found.');

        console.log(`\n--- METRICS FOR: ${store.name} ---`);
        
        // Visits count
        const { count: visitsCount } = await client
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', store.id);
        
        console.log(`Total Visits: ${visitsCount || 0}`);

        // Aggregate analytics
        const { data: analytics, error: anaError } = await client
          .from('product_analytics')
          .select('product_id, event_type')
          .eq('store_id', store.id);

        if (anaError) throw anaError;

        // Fetch product names for joining
        const { data: products } = await client.from('products').select('id, title').eq('store_id', store.id);
        const productMap = (products || []).reduce((acc: Record<string, string>, p: { id: string; title: string }) => ({ ...acc, [p.id]: p.title }), {});

        const stats = (analytics || []).reduce((acc: Record<string, any>, curr: any) => {
          if (!curr.product_id) return acc;
          const pid = curr.product_id;
          if (!acc[pid]) acc[pid] = { title: productMap[pid] || pid, likes: 0, cart: 0, skips: 0 };
          
          if (curr.event_type === 'LIKE') acc[pid].likes++;
          if (curr.event_type === 'ADD_TO_CART') acc[pid].cart++;
          if (curr.event_type === 'DISLIKE') acc[pid].skips++;
          
          return acc;
        }, {});

        console.log('\nProduct Engagement (Aggregated):');
        console.table(Object.values(stats));
        break;
      }

      case 'debug-all-products': {
        const client = await getAuthenticatedClient();
        console.log('Fetching ALL products in DB...');
        const { data, error } = await client.from('products').select('id, store_id, title');
        if (error) throw error;
        console.table(data);
        break;
      }

      default:
        console.log(`Unknown command: ${command}. Type 'help' for usage.`);
    }
  } catch (err: any) {
    console.error('--- COMMAND FAILED ---');
    console.error(err.message || err);
    if (err.details) console.error('Details:', err.details);
    if (err.hint) console.error('Hint:', err.hint);
  }
}

main();

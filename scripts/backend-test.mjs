
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// --- Configuración ---
// Cargar credenciales desde .env (que debe estar en la raíz del proyecto)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Asegúrate de que VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY están en tu archivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Generador de Datos de Prueba ---
// Usamos un número aleatorio para asegurar que cada ejecución sea con un usuario nuevo
const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
const testPhone = `+505${randomDigits}`;
const testPassword = 'password123';

console.log(`--- INICIANDO TEST DE INTEGRACIÓN AISLADO ---`);
console.log(`Usando teléfono: ${testPhone}`);
console.log(`-------------------------------------------`);

async function runTest() {
  // --- PASO 1: Invocar la función de registro ---
  console.log('\n[PASO 1] Invocando la función "orchestrate-signup"...');
  const { data: signUpData, error: signUpError } = await supabase.functions.invoke('orchestrate-signup', {
    body: { phone: testPhone, password: testPassword },
  });

  console.log('[PASO 1] Respuesta de la función:');
  console.log('Data:', JSON.stringify(signUpData, null, 2));
  console.log('Error:', JSON.stringify(signUpError, null, 2));

  if (signUpError || (signUpData && !signUpData.success)) {
    console.error('\n[FALLO] La función de registro devolvió un error. Abortando.');
    return;
  }

  console.log('\n[ÉXITO PASO 1] La función de registro se completó. Procediendo al inicio de sesión...');

  // --- PASO 2: Intentar iniciar sesión con las mismas credenciales ---
  console.log('\n[PASO 2] Intentando iniciar sesión con signInWithPassword...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: `${testPhone}@tiender.app`, // Usamos el email falso que genera el backend
    password: testPassword,
  });

  console.log('[PASO 2] Respuesta de signInWithPassword:');
  console.log('Data:', JSON.stringify(signInData, null, 2));
  console.log('Error:', JSON.stringify(signInError, null, 2));

  if (signInError) {
    console.error(`\n[FALLO CRÍTICO] ¡signInWithPassword falló! Esta es la causa del problema en el frontend.`);
    console.error(`Detalle del Error: ${signInError.message}`);
    return;
  }

  console.log('\n[ÉXITO FINAL] ¡El inicio de sesión fue exitoso!');
  console.log('Sesión de usuario:', signInData.session);
}

runTest();

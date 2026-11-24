import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const sanitizeEnv = (val?: string): string => {
  if (!val) return '';
  return val.replace(/^[\uFEFF\u200B-\u200D\s"']+|[\uFEFF\u200B-\u200D\s"']+$/g, '').trim();
};

const rawUrl = sanitizeEnv(import.meta.env.VITE_SUPABASE_URL);
const rawKey = sanitizeEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const SUPABASE_URL = rawUrl || 'https://zilkwckvsnxualaaapud.supabase.co';
export const SUPABASE_ANON_KEY =
  rawKey ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppbGt3Y2t2c254dWFsYWFhcHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODU1NjgsImV4cCI6MjA4MzI2MTU2OH0.JZYT0b6UXEhxNmytfrzLSQDg7bVeecRhk6hddXir-UQ';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = () => {
  if (!supabaseInstance) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase URL or Anon Key is missing.');
    }
    console.log('[SupabaseClient] Initializing with URL:', SUPABASE_URL.substring(0, 15) + '...');
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'antigravity-auth-token',
      }
    });
  }
  return supabaseInstance;
};

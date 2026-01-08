// src/features/auth/services/authService.ts
import { supabase } from '../../../lib/supabaseClient';
import type { SignUpWithPasswordCredentials } from '@supabase/supabase-js';

export const signUp = async (credentials: SignUpWithPasswordCredentials) => {
  const { data, error } = await supabase.auth.signUp(credentials);
  return { user: data.user, error };
};

export const signIn = async (credentials: SignUpWithPasswordCredentials) => {
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  return { user: data.user, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

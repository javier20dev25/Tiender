import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabaseClient';
import type { Store, Subscription } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  store: Store | null;
  subscription: Subscription | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  store: null,
  subscription: null, // Initial value
  loading: true,
  signOut: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null); // State for subscription
  const [loading, setLoading] = useState(true);

  // Fetches both store and subscription data for a given user
  const refreshUserSessionData = useCallback(async (userId: string) => {
    const { data: refreshedStore, error: storeError } = await getSupabase()
      .from('stores')
      .select('id, name, slug, logo_url, whatsapp_number, user_id, created_at, trial_ends_at, plan_type, community_link, product_limit')
      .eq('user_id', userId)
      .single();
    if (storeError) throw storeError;
    setStore(refreshedStore as Store | null);

    const { data: refreshedSub, error: subError } = await getSupabase()
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', userId)
      .single();
    if (subError) console.warn('Could not fetch subscription details.', subError); // Not a fatal error if sub doesn't exist
    setSubscription(refreshedSub as Subscription | null);
  }, []);

  // Calls the sync function and then refreshes all user data
  const syncAndRefreshSession = useCallback(async (userId: string) => {
    try {
      console.log('Iniciando sincronización de suscripción en segundo plano...');
      const { data, error } = await getSupabase().functions.invoke('sync-paypal-subscription');

      if (error) {
        throw new Error(`Error en la función de sync: ${error.message}`);
      }

      if (data?.status === 'reconciled' || data?.status === 'no_subscription_found') {
        console.log(`Sincronización completada (${data.status}). Refrescando datos de sesión...`);
        await refreshUserSessionData(userId);
      } else {
        console.log(`Suscripción ya estaba sincronizada con PayPal (${data?.status}).`);
      }
    } catch (e: unknown) {
      console.error('Error durante la sincronización de la suscripción en segundo plano:', e);
    }
  }, [refreshUserSessionData]);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session: currentSession } } = await getSupabase().auth.getSession();
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await refreshUserSessionData(currentUser.id).catch((err: unknown) => console.error("Error fetching initial session data:", err));
        syncAndRefreshSession(currentUser.id); // Sync in background
      }
      setLoading(false);
    };

    getInitialSession();

    const { data: authListener } = getSupabase().auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        const newUser = newSession?.user ?? null;
        setUser(newUser);

        if (newUser) {
          await refreshUserSessionData(newUser.id).catch((err: unknown) => console.error("Error refreshing session data:", err));
          syncAndRefreshSession(newUser.id);
        } else if (event === 'SIGNED_OUT') {
          setStore(null);
          setSubscription(null);
          setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [refreshUserSessionData, syncAndRefreshSession]);

  const signOut = async () => {
    await getSupabase().auth.signOut();
  };

  const value = {
    user,
    session,
    store,
    subscription, // Expose subscription state
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

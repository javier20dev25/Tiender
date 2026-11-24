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

  useEffect(() => {
    console.log('[AuthContext] State changed:', { user: user?.id, store: !!store, subscription: !!subscription, loading });
  }, [user, store, subscription, loading]);

  // Fetches both store and subscription data for a given user
  const refreshUserSessionData = useCallback(async (userId: string) => {
    console.log('[AuthContext] refreshUserSessionData start', userId);
    const storeQuery = getSupabase()
      .from('stores')
      .select('id, name, slug, logo_url, whatsapp_number, user_id, created_at, trial_ends_at, plan_type, community_link, product_limit')
      .eq('user_id', userId);

    let refreshedStore = null;
    let storeError: { code?: string; message?: string } | null = null;

    const queryAny = storeQuery as unknown as { maybeSingle?: () => Promise<{ data: Store | null; error: { code?: string; message?: string } | null }> };
    if (typeof queryAny.maybeSingle === 'function') {
      const res = await queryAny.maybeSingle();
      refreshedStore = res.data;
      storeError = res.error;
    } else {
      const res = await storeQuery.single();
      refreshedStore = res.data;
      storeError = res.error;
    }

    if (storeError && storeError.code !== 'PGRST116') {
      console.error('[AuthContext] Error fetching store:', storeError);
      throw storeError;
    }
    console.log('[AuthContext] Store fetched:', refreshedStore?.slug || 'no-slug');
    const storeObj = refreshedStore ? {
      ...refreshedStore,
      billing_exempt: refreshedStore.plan_type === 'full' || (refreshedStore.trial_ends_at ? new Date(refreshedStore.trial_ends_at).getFullYear() >= 2030 : false)
    } : null;
    setStore(storeObj as Store | null);

    let refreshedSub: Subscription | null = null;
    try {
      if (storeObj?.id) {
        const subQuery = getSupabase()
          .from('subscriptions')
          .select('status, current_period_end')
          .eq('store_id', storeObj.id);

        const subQueryAny = subQuery as unknown as { maybeSingle?: () => Promise<{ data: Subscription | null; error: unknown }> };
        if (typeof subQueryAny.maybeSingle === 'function') {
          const res = await subQueryAny.maybeSingle();
          refreshedSub = res.data;
        } else if (typeof subQuery.single === 'function') {
          try {
            const res = await subQuery.single();
            refreshedSub = res?.data;
          } catch {
            // ignore
          }
        }
      }
      
      // Si no encontró por store_id, intentar por user_id (para tests/mocks)
      if (!refreshedSub) {
        const subQuery = getSupabase()
          .from('subscriptions')
          .select('status, current_period_end')
          .eq('user_id', userId);

        const subQueryAny = subQuery as unknown as { maybeSingle?: () => Promise<{ data: Subscription | null; error: unknown }> };
        if (typeof subQueryAny.maybeSingle === 'function') {
          const res = await subQueryAny.maybeSingle();
          refreshedSub = res.data;
        } else if (typeof subQuery.single === 'function') {
          try {
            const res = await subQuery.single();
            refreshedSub = res?.data;
          } catch {
            // ignore
          }
        }
      }
    } catch (subError) {
      console.warn('[AuthContext] Could not fetch subscription details.', subError);
    }
    console.log('[AuthContext] Subscription fetched:', refreshedSub?.status || 'none');
    setSubscription(refreshedSub as Subscription | null);
    console.log('[AuthContext] refreshUserSessionData end');
  }, []);

  // Calls the sync function and then refreshes all user data
  const syncAndRefreshSession = useCallback(async (userId: string) => {
    try {
      if (import.meta.env.DEV) console.log('Iniciando sincronización de suscripción en segundo plano...');
      const { data, error } = await getSupabase().functions.invoke('sync-paypal-subscription');

      if (error) {
        throw new Error(`Error en la función de sync: ${error.message}`);
      }

      if (data?.status === 'reconciled' || data?.status === 'no_subscription_found') {
        if (import.meta.env.DEV) console.log(`Sincronización completada (${data.status}). Refrescando datos de sesión...`);
        await refreshUserSessionData(userId);
      } else {
        if (import.meta.env.DEV) console.log(`Suscripción ya estaba sincronizada con PayPal (${data?.status}).`);
      }
    } catch (e: unknown) {
      console.error('Error durante la sincronización de la suscripción en segundo plano:', e);
    }
  }, [refreshUserSessionData]);

  useEffect(() => {
    const getInitialSession = async () => {
      console.log('[AuthContext] getInitialSession start');

      // Safety timeout: ensure loading is false after 10 seconds no matter what
      const safetyTimeout = setTimeout(() => {
        if (import.meta.env.DEV) console.warn('[AuthContext] Safety timeout reached, forcing loading to false');
        setLoading(false);
      }, 10000);

      try {
        const { data: { session: currentSession } } = await getSupabase().auth.getSession();
        console.log('[AuthContext] getInitialSession: Session fetched', currentSession?.user?.id || 'none');
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          console.log('[AuthContext] getInitialSession: User found, refreshing data...');
          try {
            await refreshUserSessionData(currentUser.id);
            syncAndRefreshSession(currentUser.id); // Sync in background
          } catch (err: unknown) {
            console.error("[AuthContext] getInitialSession: Error fetching data:", err);
          }
        }
      } catch (err) {
        console.error('[AuthContext] getInitialSession: Unexpected error:', err);
      } finally {
        clearTimeout(safetyTimeout);
        console.log('[AuthContext] Setting loading to false');
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: authListener } = getSupabase().auth.onAuthStateChange(
      async (event, newSession) => {
        if (import.meta.env.DEV) console.log(`[AuthContext] onAuthStateChange event: ${event}`);

        const newUser = newSession?.user ?? null;

        // Update basic auth state
        setSession(newSession);
        setUser(newUser);

        if (newUser) {
          try {
            console.log('[AuthContext] Auth change (signed in or refreshed): updating data...');
            await refreshUserSessionData(newUser.id);
            syncAndRefreshSession(newUser.id);
          } catch (err: unknown) {
            console.error("[AuthContext] Error on auth change:", err);
          }
        } else if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !newSession)) {
          console.log('[AuthContext] Session cleared');
          setStore(null);
          setSubscription(null);
        }
        
        // Ensure loading is false after we've had a chance to process the event
        setLoading(false);
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


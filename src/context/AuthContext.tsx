import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabaseClient';

// Define our strict subscription status ENUM for the frontend
type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'unpaid' | 'canceled';

// Define the type for the subscription object
interface Subscription {
  status: SubscriptionStatus;
  current_period_end: string | null;
  // ... any other subscription fields needed by the frontend
}

import type { Store } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  store: Store | null;
  subscription: Subscription | null; // Add subscription to the context
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
  const refreshUserSessionData = async (userId: string) => {
    const { data: refreshedStore, error: storeError } = await getSupabase()
      .from('stores')
      .select('*')
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
  };

  // Calls the sync function and then refreshes all user data
  const syncAndRefreshSession = async (userId: string) => {
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
    } catch (e) {
      console.error('Error durante la sincronización de la suscripción en segundo plano:', e);
    }
  };

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session: currentSession } } = await getSupabase().auth.getSession();
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await refreshUserSessionData(currentUser.id).catch(err => console.error("Error fetching initial session data:", err));
        syncAndRefreshSession(currentUser.id); // Sync in background
      }
      setLoading(false);
    };

    getInitialSession();

    const { data: authListener } = getSupabase().auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        const newUser = newSession?.user ?? null;
        setUser(newUser);

        if (newUser) {
          setLoading(true);
          await refreshUserSessionData(newUser.id).catch(err => console.error("Error fetching session data on auth change:", err));
          setLoading(false);
          syncAndRefreshSession(newUser.id); // Sync in background
        } else {
          setStore(null);
          setSubscription(null);
          setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

// Definimos el tipo para la tienda
interface Store {
  id: string;
  name: string;
  plan_type: 'standard' | 'full' | 'trial' | null;
  trial_ends_at: string | null;
  // ... otros campos que puedas necesitar
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  store: Store | null; // Añadimos la tienda al contexto
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  store: null, // Valor inicial
  loading: true,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [store, setStore] = useState<Store | null>(null); // Estado para la tienda
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSessionAndStore = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Si hay un usuario, buscamos su tienda
        const { data: userStore, error } = await supabase
          .from('stores')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();

        if (error) {
          console.error('Error fetching store:', error);
        }
        setStore(userStore as Store | null);
      }
      setLoading(false);
    };

    getSessionAndStore();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        const newUser = newSession?.user ?? null;
        setUser(newUser);
        
        if (newUser) {
          // Si el estado de auth cambia y hay un usuario, volvemos a buscar la tienda
          const { data: userStore, error } = await supabase
            .from('stores')
            .select('*')
            .eq('user_id', newUser.id)
            .single();
          if (error) console.error('Error fetching store on auth change:', error);
          setStore(userStore as Store | null);
        } else {
          // Si el usuario cierra sesión, limpiamos los datos de la tienda
          setStore(null);
        }
        
        if (loading) {
            setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loading]);

  const signOut = async () => {
    await supabase.auth.signOut();
    // Los estados se limpiarán gracias al listener
  };

  const value = {
    user,
    session,
    store, // Exponemos la tienda
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

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    console.log('[Auth] Starting signup for:', email);
    
    try {
      // Call edge function for server-side password validation
      console.log('[Auth] Calling signup-with-validation edge function...');
      const { data, error } = await supabase.functions.invoke('signup-with-validation', {
        body: { email, password, fullName }
      });

      console.log('[Auth] Edge function response:', { data, error });

      if (error) {
        console.error('[Auth] Edge function error:', error);
        return { error: { message: error.message } };
      }

      if (data?.error) {
        console.error('[Auth] Signup validation error:', data.error, data.details);
        return { error: { message: data.error, details: data.details } };
      }

      console.log('[Auth] User created, attempting sign in...');
      
      // Sign in the user after successful signup
      const { error: signInError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (signInError) {
        console.error('[Auth] Sign in after signup failed:', signInError);
      } else {
        console.log('[Auth] Sign in successful!');
      }

      return { error: signInError };
    } catch (err) {
      console.error('[Auth] Unexpected error during signup:', err);
      return { error: { message: 'An unexpected error occurred during signup' } };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

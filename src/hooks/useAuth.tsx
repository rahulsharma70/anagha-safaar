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
    try {
      const { data, error } = await supabase.functions.invoke('signup-with-validation', {
        body: { email, password, fullName }
      });

      // supabase.functions.invoke returns error for non-2xx responses
      if (error) {
        // Try to parse the error body for details
        let message = 'Failed to create account';
        try {
          const parsed = typeof error === 'string' ? JSON.parse(error) : error;
          message = parsed?.message || parsed?.error || error.message || message;
        } catch {
          message = error.message || message;
        }
        return { error: { message } };
      }

      // Check if the response body contains an error
      if (data?.error) {
        const details = data.details ? `: ${data.details.join(', ')}` : '';
        return { error: { message: `${data.error}${details}` } };
      }

      // Signup successful, now sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      return { error: signInError };
    } catch (err: any) {
      return { error: { message: err?.message || 'An unexpected error occurred during signup' } };
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

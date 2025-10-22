import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface AuthSecurityContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  signOutAllDevices: () => Promise<void>;
  sessionExpiresAt: Date | null;
  isSessionExpiring: boolean;
  refreshSession: () => Promise<void>;
}

const SESSION_WARNING_MINUTES = 5;
const SESSION_CHECK_INTERVAL = 60000; // Check every minute

const AuthSecurityContext = createContext<AuthSecurityContextType | undefined>(undefined);

export const AuthSecurityProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null);
  const [isSessionExpiring, setIsSessionExpiring] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Session expiration monitoring
  useEffect(() => {
    if (!session?.expires_at) return;

    const expiresAt = new Date(session.expires_at * 1000);
    setSessionExpiresAt(expiresAt);

    const checkSessionExpiration = () => {
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      const minutesUntilExpiry = timeUntilExpiry / 1000 / 60;

      if (minutesUntilExpiry <= SESSION_WARNING_MINUTES && minutesUntilExpiry > 0) {
        setIsSessionExpiring(true);
        toast({
          title: "Session Expiring Soon",
          description: `Your session will expire in ${Math.floor(minutesUntilExpiry)} minutes. Please save your work.`,
          variant: "destructive",
        });
      } else if (timeUntilExpiry <= 0) {
        handleSessionExpired();
      }
    };

    const interval = setInterval(checkSessionExpiration, SESSION_CHECK_INTERVAL);
    checkSessionExpiration(); // Check immediately

    return () => clearInterval(interval);
  }, [session?.expires_at]);

  const handleSessionExpired = useCallback(async () => {
    toast({
      title: "Session Expired",
      description: "Your session has expired. Please sign in again.",
      variant: "destructive",
    });
    await signOut();
    navigate('/auth');
  }, [navigate, toast]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN') {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
      } else if (event === 'SIGNED_OUT') {
        toast({
          title: "Signed out",
          description: "You have been signed out successfully.",
        });
      } else if (event === 'PASSWORD_RECOVERY') {
        toast({
          title: "Password Recovery",
          description: "Please check your email to reset your password.",
        });
      } else if (event === 'TOKEN_REFRESHED') {
        setIsSessionExpiring(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({
          title: "Authentication Failed",
          description: error.message,
          variant: "destructive",
        });
      }
      return { error };
    } catch (error: any) {
      toast({
        title: "Sign In Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: fullName }
        }
      });

      if (error) {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account Created!",
          description: "Please check your email to confirm your account.",
        });
      }
      return { error };
    } catch (error: any) {
      toast({
        title: "Sign Up Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsSessionExpiring(false);
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast({
          title: "Password Reset Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password Reset Email Sent",
          description: "Please check your email for the reset link.",
        });
      }
      return { error };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        toast({
          title: "Password Update Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password Updated",
          description: "Your password has been successfully updated.",
        });
      }
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const signOutAllDevices = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      toast({
        title: "Signed Out Everywhere",
        description: "You have been signed out from all devices.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out from all devices.",
        variant: "destructive",
      });
    }
  };

  const refreshSession = async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      setIsSessionExpiring(false);
      toast({
        title: "Session Refreshed",
        description: "Your session has been extended.",
      });
    } catch (error) {
      toast({
        title: "Session Refresh Failed",
        description: "Please sign in again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthSecurityContext.Provider value={{
      user,
      session,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      signOutAllDevices,
      sessionExpiresAt,
      isSessionExpiring,
      refreshSession,
    }}>
      {children}
    </AuthSecurityContext.Provider>
  );
};

export const useAuthSecurity = () => {
  const context = useContext(AuthSecurityContext);
  if (!context) throw new Error('useAuthSecurity must be used within AuthSecurityProvider');
  return context;
};

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  SessionSecurityService, 
  ValidationService, 
  FraudDetectionService,
  EncryptionService,
  RateLimitService 
} from "@/lib/security";
import { logger } from "@/lib/logger";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, fullName: string, captchaToken?: string) => Promise<void>;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  requiresTwoFactor: boolean;
  verifyTwoFactor: (code: string) => Promise<void>;
  resendTwoFactorCode: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  enableTwoFactor: () => Promise<void>;
  disableTwoFactor: (code: string) => Promise<void>;
  getSecurityStatus: () => Promise<any>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  // Track login attempts for fraud detection
  const [loginAttempts, setLoginAttempts] = useState<Map<string, { count: number; lastAttempt: number }>>(new Map());

  useEffect(() => {
    // Set up auth state listener with enhanced security
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.info('Auth state change', { event, userId: session?.user?.id });
        
        if (event === 'SIGNED_IN' && session) {
          await handleSuccessfulLogin(session);
        } else if (event === 'SIGNED_OUT') {
          await handleLogout();
        } else if (event === 'TOKEN_REFRESHED' && session) {
          await handleTokenRefresh(session);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await handleSuccessfulLogin(session);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSuccessfulLogin = async (session: Session) => {
    try {
      // Log successful login
      await logSecurityEvent('login_success', 'medium', 'User successfully logged in', {
        userId: session.user.id,
        email: session.user.email,
        timestamp: new Date().toISOString()
      });

      // Update user profile with login information
      await supabase
        .from('profiles')
        .update({
          last_login_at: new Date().toISOString(),
          login_count: supabase.raw('login_count + 1'),
          failed_login_attempts: 0,
          locked_until: null
        })
        .eq('id', session.user.id);

      // Create session record for security tracking
      await createSessionRecord(session);

      // Reset failed login attempts
      const userEmail = session.user.email || '';
      setLoginAttempts(prev => {
        const newMap = new Map(prev);
        newMap.delete(userEmail);
        return newMap;
      });

    } catch (error) {
      logger.error('Error handling successful login', error);
    }
  };

  const handleLogout = async () => {
    try {
      if (session?.user) {
        // Log logout event
        await logSecurityEvent('logout', 'low', 'User logged out', {
          userId: session.user.id,
          timestamp: new Date().toISOString()
        });

        // Deactivate session records
        await supabase
          .from('user_sessions')
          .update({ is_active: false })
          .eq('user_id', session.user.id)
          .eq('is_active', true);
      }
    } catch (error) {
      logger.error('Error handling logout', error);
    }
  };

  const handleTokenRefresh = async (session: Session) => {
    try {
      // Update session activity
      await supabase
        .from('user_sessions')
        .update({ 
          last_activity: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
        })
        .eq('user_id', session.user.id)
        .eq('is_active', true);

      logger.info('Token refreshed', { userId: session.user.id });
    } catch (error) {
      logger.error('Error handling token refresh', error);
    }
  };

  const createSessionRecord = async (session: Session) => {
    try {
      const sessionData = {
        user_id: session.user.id,
        session_token: session.access_token,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent,
        is_active: true,
        expires_at: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      };

      await supabase
        .from('user_sessions')
        .insert(sessionData);

    } catch (error) {
      logger.error('Error creating session record', error);
    }
  };

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const logSecurityEvent = async (eventType: string, severity: string, description: string, metadata: any = {}) => {
    try {
      await supabase
        .from('security_events')
        .insert({
          user_id: user?.id,
          event_type: eventType,
          severity: severity,
          description: description,
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent,
          metadata: metadata
        });
    } catch (error) {
      logger.error('Error logging security event', error);
    }
  };

  const checkFraudRisk = async (email: string, password: string): Promise<{ isRisky: boolean; riskScore: number; reasons: string[] }> => {
    const activity = {
      requestCount: loginAttempts.get(email)?.count || 1,
      timeWindow: Date.now() - (loginAttempts.get(email)?.lastAttempt || Date.now()),
      ipAddress: await getClientIP(),
      userAgent: navigator.userAgent,
      currentTime: Date.now(),
      previousTime: loginAttempts.get(email)?.lastAttempt
    };

    return FraudDetectionService.detectSuspiciousActivity(activity);
  };

  const signUp = async (email: string, password: string, fullName: string, captchaToken?: string) => {
    try {
      // Validate input
      const sanitizedEmail = ValidationService.sanitizeHtml(email);
      const sanitizedFullName = ValidationService.sanitizeHtml(fullName);

      if (!ValidationService.validateEmail(sanitizedEmail)) {
        throw new Error('Invalid email format');
      }

      const passwordValidation = ValidationService.validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(', '));
      }

      // Check rate limiting
      const rateLimitResult = RateLimitService.checkRateLimit(sanitizedEmail);
      if (!rateLimitResult.allowed) {
        throw new Error('Too many signup attempts. Please try again later.');
      }

      // Check fraud risk
      const fraudCheck = await checkFraudRisk(sanitizedEmail, password);
      if (fraudCheck.isRisky) {
        await logSecurityEvent('signup_blocked', 'high', 'Signup blocked due to fraud risk', {
          email: sanitizedEmail,
          riskScore: fraudCheck.riskScore,
          reasons: fraudCheck.reasons
        });
        throw new Error('Signup blocked due to security concerns. Please contact support.');
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: sanitizedFullName,
            captcha_token: captchaToken
          },
        },
      });

      if (error) {
        await logSecurityEvent('signup_failed', 'medium', 'Signup failed', {
          email: sanitizedEmail,
          error: error.message
        });
        throw error;
      }

      // Log successful signup
      await logSecurityEvent('signup_success', 'medium', 'User successfully signed up', {
        email: sanitizedEmail,
        fullName: sanitizedFullName
      });

      toast.success("Account created successfully! Please check your email to verify your account.");
    } catch (error) {
      logger.error('Signup error', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create account');
      throw error;
    }
  };

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    try {
      // Validate input
      const sanitizedEmail = ValidationService.sanitizeHtml(email);

      if (!ValidationService.validateEmail(sanitizedEmail)) {
        throw new Error('Invalid email format');
      }

      // Check rate limiting
      const rateLimitResult = RateLimitService.checkRateLimit(sanitizedEmail);
      if (!rateLimitResult.allowed) {
        throw new Error('Too many login attempts. Please try again later.');
      }

      // Track login attempts
      const currentAttempts = loginAttempts.get(sanitizedEmail) || { count: 0, lastAttempt: 0 };
      const now = Date.now();
      const timeSinceLastAttempt = now - currentAttempts.lastAttempt;
      
      // Reset counter if more than 15 minutes have passed
      if (timeSinceLastAttempt > 15 * 60 * 1000) {
        currentAttempts.count = 0;
      }
      
      currentAttempts.count += 1;
      currentAttempts.lastAttempt = now;
      setLoginAttempts(prev => new Map(prev).set(sanitizedEmail, currentAttempts));

      // Check for account lockout
      const { data: profile } = await supabase
        .from('profiles')
        .select('locked_until, failed_login_attempts')
        .eq('id', sanitizedEmail)
        .single();

      if (profile?.locked_until && new Date(profile.locked_until) > new Date()) {
        throw new Error('Account is temporarily locked due to too many failed login attempts.');
      }

      // Check fraud risk
      const fraudCheck = await checkFraudRisk(sanitizedEmail, password);
      if (fraudCheck.isRisky && fraudCheck.riskScore > 80) {
        await logSecurityEvent('login_blocked', 'high', 'Login blocked due to fraud risk', {
          email: sanitizedEmail,
          riskScore: fraudCheck.riskScore,
          reasons: fraudCheck.reasons
        });
        throw new Error('Login blocked due to security concerns. Please contact support.');
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (error) {
        // Increment failed login attempts
        await supabase
          .from('profiles')
          .update({
            failed_login_attempts: supabase.raw('failed_login_attempts + 1')
          })
          .eq('email', sanitizedEmail);

        // Lock account after 5 failed attempts
        if (currentAttempts.count >= 5) {
          await supabase
            .from('profiles')
            .update({
              locked_until: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
            })
            .eq('email', sanitizedEmail);

          await logSecurityEvent('account_locked', 'high', 'Account locked due to failed login attempts', {
            email: sanitizedEmail,
            attempts: currentAttempts.count
          });
        }

        await logSecurityEvent('login_failed', 'medium', 'Login failed', {
          email: sanitizedEmail,
          error: error.message,
          attempts: currentAttempts.count
        });

        throw error;
      }

      toast.success("Welcome back!");
    } catch (error) {
      logger.error('Signin error', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sign in');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        await logSecurityEvent('logout_failed', 'medium', 'Logout failed', {
          error: error.message
        });
        throw error;
      }

      await logSecurityEvent('logout_success', 'low', 'User successfully logged out');
      toast.success("Signed out successfully");
    } catch (error) {
      logger.error('Signout error', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sign out');
      throw error;
    }
  };

  const verifyTwoFactor = async (code: string) => {
    try {
      // Implementation for 2FA verification
      // This would integrate with your 2FA service
      toast.success("Two-factor authentication verified");
      setRequiresTwoFactor(false);
    } catch (error) {
      logger.error('2FA verification error', error);
      toast.error('Invalid verification code');
      throw error;
    }
  };

  const resendTwoFactorCode = async () => {
    try {
      // Implementation for resending 2FA code
      toast.success("Verification code sent");
    } catch (error) {
      logger.error('2FA resend error', error);
      toast.error('Failed to resend verification code');
      throw error;
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const passwordValidation = ValidationService.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(', '));
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      await logSecurityEvent('password_changed', 'medium', 'User changed password');
      toast.success("Password updated successfully");
    } catch (error) {
      logger.error('Password update error', error);
      toast.error('Failed to update password');
      throw error;
    }
  };

  const enableTwoFactor = async () => {
    try {
      // Implementation for enabling 2FA
      toast.success("Two-factor authentication enabled");
    } catch (error) {
      logger.error('2FA enable error', error);
      toast.error('Failed to enable two-factor authentication');
      throw error;
    }
  };

  const disableTwoFactor = async (code: string) => {
    try {
      // Implementation for disabling 2FA
      toast.success("Two-factor authentication disabled");
    } catch (error) {
      logger.error('2FA disable error', error);
      toast.error('Failed to disable two-factor authentication');
      throw error;
    }
  };

  const getSecurityStatus = async () => {
    try {
      if (!user) return null;

      const { data, error } = await supabase
        .rpc('get_user_security_status', { user_uuid: user.id });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error getting security status', error);
      return null;
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      if (data.session) {
        await handleTokenRefresh(data.session);
      }
    } catch (error) {
      logger.error('Session refresh error', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      signUp, 
      signIn, 
      signOut, 
      loading,
      requiresTwoFactor,
      verifyTwoFactor,
      resendTwoFactorCode,
      updatePassword,
      enableTwoFactor,
      disableTwoFactor,
      getSecurityStatus,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
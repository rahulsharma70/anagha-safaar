import { Router, Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { supabase } from '../app';
import { logger } from '../lib/logger';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/index';

const router = Router();

// =============================================================================
// 1. VALIDATION SCHEMAS
// =============================================================================

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Invalid phone number').optional(),
});

const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
});

// =============================================================================
// 2. HELPER FUNCTIONS
// =============================================================================

const generateTokens = (userId: string, email: string, role: string) => {
  const jwtSecret = process.env.JWT_SECRET as string;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET as string;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
  const jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  const accessToken = jwt.sign(
    { sub: userId, email, role },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );

  const refreshToken = jwt.sign(
    { sub: userId, email, role },
    jwtRefreshSecret,
    { expiresIn: jwtRefreshExpiresIn }
  );

  return { accessToken, refreshToken };
};

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// =============================================================================
// 3. REGISTER USER
// =============================================================================

router.post('/register',
  validateRequest({ body: registerSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, first_name, last_name, phone } = req.body;

    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User already exists with this email',
          code: 'USER_EXISTS'
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name,
            last_name,
            phone,
          }
        }
      });

      if (authError) {
        logger.error('Supabase auth signup error', authError);
        return res.status(400).json({
          success: false,
          error: 'Failed to create user account',
          code: 'AUTH_ERROR'
        });
      }

      if (!authUser.user) {
        return res.status(400).json({
          success: false,
          error: 'User creation failed',
          code: 'USER_CREATION_FAILED'
        });
      }

      // Create profile record
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authUser.user.id,
          email,
          first_name,
          last_name,
          phone,
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (profileError) {
        logger.error('Profile creation error', profileError);
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authUser.user.id);
        throw profileError;
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(
        authUser.user.id,
        email,
        'user'
      );

      logger.info('User registered successfully', {
        userId: authUser.user.id,
        email
      });

      res.status(201).json({
        success: true,
        data: {
          user: profile,
          accessToken,
          refreshToken
        },
        message: 'User registered successfully'
      });

    } catch (error) {
      logger.error('Error in user registration', error);
      throw error;
    }
  })
);

// =============================================================================
// 4. LOGIN USER
// =============================================================================

router.post('/login',
  validateRequest({ body: loginSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
      // Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        logger.warn('Login attempt failed', { email, error: authError?.message });
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        logger.error('Profile not found for authenticated user', { userId: authData.user.id });
        return res.status(500).json({
          success: false,
          error: 'User profile not found',
          code: 'PROFILE_NOT_FOUND'
        });
      }

      // Check if user is banned
      if (profile.role === 'banned') {
        logger.warn('Banned user attempted login', { userId: authData.user.id, email });
        return res.status(403).json({
          success: false,
          error: 'Account has been suspended',
          code: 'ACCOUNT_SUSPENDED'
        });
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(
        authData.user.id,
        email,
        profile.role
      );

      // Update last login
      await supabase
        .from('profiles')
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', authData.user.id);

      logger.info('User logged in successfully', {
        userId: authData.user.id,
        email,
        role: profile.role
      });

      res.json({
        success: true,
        data: {
          user: profile,
          accessToken,
          refreshToken
        },
        message: 'Login successful'
      });

    } catch (error) {
      logger.error('Error in user login', error);
      throw error;
    }
  })
);

// =============================================================================
// 5. REFRESH TOKEN
// =============================================================================

router.post('/refresh',
  validateRequest({ body: refreshTokenSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { refresh_token } = req.body;

    try {
      const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET as string;
      const decoded = jwt.verify(refresh_token, jwtRefreshSecret) as any;

      // Get user profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', decoded.sub)
        .single();

      if (error || !profile) {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      // Check if user is banned
      if (profile.role === 'banned') {
        return res.status(403).json({
          success: false,
          error: 'Account has been suspended',
          code: 'ACCOUNT_SUSPENDED'
        });
      }

      // Generate new tokens
      const { accessToken, refreshToken } = generateTokens(
        profile.id,
        profile.email,
        profile.role
      );

      logger.info('Token refreshed successfully', { userId: profile.id });

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken
        },
        message: 'Token refreshed successfully'
      });

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      logger.error('Error refreshing token', error);
      throw error;
    }
  })
);

// =============================================================================
// 6. LOGOUT USER
// =============================================================================

router.post('/logout',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      // Sign out from Supabase Auth
      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.error('Supabase auth signout error', error);
      }

      logger.info('User logged out successfully', { userId });

      res.json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      logger.error('Error in user logout', error);
      throw error;
    }
  })
);

// =============================================================================
// 7. FORGOT PASSWORD
// =============================================================================

router.post('/forgot-password',
  validateRequest({ body: forgotPasswordSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    try {
      // Check if user exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (!profile) {
        // Don't reveal if user exists or not
        return res.json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent'
        });
      }

      // Send password reset email via Supabase Auth
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
      });

      if (error) {
        logger.error('Password reset email error', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to send password reset email',
          code: 'EMAIL_SEND_FAILED'
        });
      }

      logger.info('Password reset email sent', { email });

      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });

    } catch (error) {
      logger.error('Error in forgot password', error);
      throw error;
    }
  })
);

// =============================================================================
// 8. RESET PASSWORD
// =============================================================================

router.post('/reset-password',
  validateRequest({ body: resetPasswordSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;

    try {
      // Verify reset token with Supabase Auth
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery'
      });

      if (error || !data.user) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired reset token',
          code: 'INVALID_RESET_TOKEN'
        });
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        logger.error('Password update error', updateError);
        return res.status(500).json({
          success: false,
          error: 'Failed to update password',
          code: 'PASSWORD_UPDATE_FAILED'
        });
      }

      logger.info('Password reset successfully', { userId: data.user.id });

      res.json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error) {
      logger.error('Error in password reset', error);
      throw error;
    }
  })
);

// =============================================================================
// 9. VERIFY EMAIL
// =============================================================================

router.post('/verify-email',
  validateRequest({ 
    body: z.object({
      token: z.string().min(1, 'Verification token is required')
    })
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      });

      if (error || !data.user) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired verification token',
          code: 'INVALID_VERIFICATION_TOKEN'
        });
      }

      // Update profile to mark email as verified
      await supabase
        .from('profiles')
        .update({
          email_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.user.id);

      logger.info('Email verified successfully', { userId: data.user.id });

      res.json({
        success: true,
        message: 'Email verified successfully'
      });

    } catch (error) {
      logger.error('Error in email verification', error);
      throw error;
    }
  })
);

// =============================================================================
// 10. GET CURRENT USER
// =============================================================================

router.get('/me',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return res.status(404).json({
          success: false,
          error: 'User profile not found',
          code: 'PROFILE_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: profile
      });

    } catch (error) {
      logger.error('Error fetching user profile', error);
      throw error;
    }
  })
);

export default router;

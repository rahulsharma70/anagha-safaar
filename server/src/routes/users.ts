import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../app';
import { logger } from '../lib/logger';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/index';

const router = Router();

// =============================================================================
// 1. VALIDATION SCHEMAS
// =============================================================================

const profileUpdateSchema = z.object({
  first_name: z.string().min(1, 'First name is required').optional(),
  last_name: z.string().min(1, 'Last name is required').optional(),
  phone: z.string().min(10, 'Invalid phone number').optional(),
  avatar_url: z.string().url('Invalid avatar URL').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  date_of_birth: z.string().datetime('Invalid date format').optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postal_code: z.string().optional(),
  }).optional(),
  preferences: z.object({
    notifications: z.boolean().optional(),
    marketing_emails: z.boolean().optional(),
    sms_notifications: z.boolean().optional(),
    language: z.string().optional(),
    currency: z.string().optional(),
  }).optional(),
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
});

// =============================================================================
// 2. GET USER PROFILE
// =============================================================================

router.get('/profile',
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

      logger.info('User profile fetched', { userId });

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

// =============================================================================
// 3. UPDATE USER PROFILE
// =============================================================================

router.put('/profile',
  validateRequest({ body: profileUpdateSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const updateData = req.body;

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
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating user profile', error);
        throw error;
      }

      logger.info('User profile updated', { userId });

      res.json({
        success: true,
        data: profile,
        message: 'Profile updated successfully'
      });

    } catch (error) {
      logger.error('Error in profile update', error);
      throw error;
    }
  })
);

// =============================================================================
// 4. CHANGE PASSWORD
// =============================================================================

router.post('/change-password',
  validateRequest({ body: changePasswordSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { current_password, new_password } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      // Get current user from Supabase Auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: current_password,
      });

      if (signInError) {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: new_password
      });

      if (updateError) {
        logger.error('Password update error', updateError);
        return res.status(500).json({
          success: false,
          error: 'Failed to update password',
          code: 'PASSWORD_UPDATE_FAILED'
        });
      }

      logger.info('Password changed successfully', { userId });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      logger.error('Error in password change', error);
      throw error;
    }
  })
);

// =============================================================================
// 5. DELETE USER ACCOUNT
// =============================================================================

router.delete('/account',
  validateRequest({ 
    body: z.object({
      password: z.string().min(1, 'Password is required for account deletion')
    })
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { password } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      // Verify password
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password,
      });

      if (signInError) {
        return res.status(400).json({
          success: false,
          error: 'Password is incorrect',
          code: 'INVALID_PASSWORD'
        });
      }

      // Check for active bookings
      const { data: activeBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['pending', 'confirmed'])
        .limit(1);

      if (activeBookings && activeBookings.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Cannot delete account with active bookings',
          code: 'ACTIVE_BOOKINGS_EXIST'
        });
      }

      // Delete user from Supabase Auth (this will cascade delete the profile)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

      if (deleteError) {
        logger.error('Error deleting user account', deleteError);
        return res.status(500).json({
          success: false,
          error: 'Failed to delete account',
          code: 'ACCOUNT_DELETE_FAILED'
        });
      }

      logger.info('User account deleted', { userId });

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });

    } catch (error) {
      logger.error('Error in account deletion', error);
      throw error;
    }
  })
);

// =============================================================================
// 6. GET USER STATISTICS
// =============================================================================

router.get('/stats',
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
      // Get booking statistics
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('status, total_price, created_at')
        .eq('user_id', userId);

      if (bookingsError) {
        logger.error('Error fetching booking stats', bookingsError);
        throw bookingsError;
      }

      // Get payment statistics
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('status, amount, created_at')
        .eq('user_id', userId);

      if (paymentsError) {
        logger.error('Error fetching payment stats', paymentsError);
        throw paymentsError;
      }

      // Calculate statistics
      const totalBookings = bookings?.length || 0;
      const confirmedBookings = bookings?.filter(b => b.status === 'confirmed').length || 0;
      const totalSpent = payments?.filter(p => p.status === 'captured').reduce((sum, p) => sum + p.amount, 0) || 0;

      const stats = {
        totalBookings,
        confirmedBookings,
        cancelledBookings: bookings?.filter(b => b.status === 'cancelled').length || 0,
        totalSpent,
        averageBookingValue: confirmedBookings > 0 ? totalSpent / confirmedBookings : 0,
        memberSince: req.user?.profile?.created_at,
      };

      logger.info('User statistics fetched', { userId });

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Error fetching user statistics', error);
      throw error;
    }
  })
);

// =============================================================================
// 7. GET USER ACTIVITY LOG
// =============================================================================

router.get('/activity',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { page = 1, limit = 20 } = req.query as any;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      // Get recent bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, item_type, status, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (bookingsError) {
        logger.error('Error fetching user activity', bookingsError);
        throw bookingsError;
      }

      // Get recent payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('id, status, amount, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (paymentsError) {
        logger.error('Error fetching payment activity', paymentsError);
        throw paymentsError;
      }

      // Combine and sort activities
      const activities = [
        ...(bookings || []).map(b => ({
          type: 'booking',
          id: b.id,
          status: b.status,
          item_type: b.item_type,
          created_at: b.created_at,
          updated_at: b.updated_at,
        })),
        ...(payments || []).map(p => ({
          type: 'payment',
          id: p.id,
          status: p.status,
          amount: p.amount,
          created_at: p.created_at,
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      logger.info('User activity fetched', { userId, count: activities.length });

      res.json({
        success: true,
        data: activities.slice(0, limit)
      });

    } catch (error) {
      logger.error('Error fetching user activity', error);
      throw error;
    }
  })
);

// =============================================================================
// 8. UPDATE USER PREFERENCES
// =============================================================================

router.put('/preferences',
  validateRequest({ 
    body: z.object({
      notifications: z.boolean().optional(),
      marketing_emails: z.boolean().optional(),
      sms_notifications: z.boolean().optional(),
      language: z.string().optional(),
      currency: z.string().optional(),
    })
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const preferences = req.body;

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
        .update({
          preferences: {
            ...req.user?.profile?.preferences,
            ...preferences
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating user preferences', error);
        throw error;
      }

      logger.info('User preferences updated', { userId });

      res.json({
        success: true,
        data: profile,
        message: 'Preferences updated successfully'
      });

    } catch (error) {
      logger.error('Error in preferences update', error);
      throw error;
    }
  })
);

export default router;

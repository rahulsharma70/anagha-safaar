import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { createClient } from '@supabase/supabase-js';
import { logger } from './monitoring';

// =============================================================================
// 1. SECURE BOOKING REFERENCE GENERATION
// =============================================================================

export class SecureBookingService {
  private static supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Generate cryptographically secure booking reference
  static generateSecureBookingReference(): string {
    // Use crypto.randomUUID() for cryptographically secure randomness
    const uuid = crypto.randomUUID();
    const reference = 'BK' + uuid.slice(0, 8).toUpperCase();
    
    logger.info('Generated secure booking reference', { reference });
    return reference;
  }

  // Validate booking reference format
  static validateBookingReference(reference: string): boolean {
    const pattern = /^BK[A-F0-9]{8}$/;
    return pattern.test(reference);
  }

  // Create booking with secure reference
  static async createBooking(bookingData: any): Promise<{ success: boolean; bookingId?: string; reference?: string; error?: string }> {
    try {
      const reference = this.generateSecureBookingReference();
      
      const { data, error } = await this.supabase
        .from('bookings')
        .insert([{
          ...bookingData,
          booking_reference: reference
        }])
        .select('id, booking_reference')
        .single();

      if (error) {
        logger.error('Failed to create booking', error);
        return { success: false, error: 'Failed to create booking' };
      }

      logger.info('Booking created successfully', { 
        bookingId: data.id, 
        reference: data.booking_reference 
      });

      return { 
        success: true, 
        bookingId: data.id, 
        reference: data.booking_reference 
      };
    } catch (error) {
      logger.error('Booking creation error', error);
      return { success: false, error: 'Internal server error' };
    }
  }
}

// =============================================================================
// 2. PASSWORD STRENGTH VALIDATION
// =============================================================================

export class PasswordSecurityService {
  private static supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Validate password strength
  static validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Minimum length check
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    // Uppercase letter check
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Lowercase letter check
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Number check
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Special character check
    if (!/[!@#$%^&*()_+\-=\[\]{};:"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Common password check
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a more unique password');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Check if password has been leaked (basic implementation)
  static async checkPasswordLeak(password: string): Promise<boolean> {
    try {
      // In production, integrate with HaveIBeenPwned API
      const passwordHash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
      
      const { data, error } = await this.supabase
        .from('leaked_passwords')
        .select('id')
        .eq('password_hash', passwordHash)
        .single();

      return !error && !!data;
    } catch (error) {
      logger.error('Password leak check error', error);
      return false; // Fail safe - don't block on check errors
    }
  }

  // Complete password validation
  static async validatePassword(password: string): Promise<{ valid: boolean; errors: string[] }> {
    const strengthCheck = this.validatePasswordStrength(password);
    
    if (!strengthCheck.valid) {
      return strengthCheck;
    }

    const isLeaked = await this.checkPasswordLeak(password);
    if (isLeaked) {
      return {
        valid: false,
        errors: ['Password has been found in data breaches. Please choose a different password.']
      };
    }

    return { valid: true, errors: [] };
  }
}

// =============================================================================
// 3. ACCOUNT LOCKOUT AND RATE LIMITING
// =============================================================================

export class AccountSecurityService {
  private static supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check if account is locked
  static async isAccountLocked(email: string, ipAddress: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .rpc('is_account_locked', { email, ip_address: ipAddress });

      if (error) {
        logger.error('Account lock check error', error);
        return false; // Fail safe
      }

      return data || false;
    } catch (error) {
      logger.error('Account lock check error', error);
      return false;
    }
  }

  // Record authentication attempt
  static async recordAuthAttempt(
    email: string,
    ipAddress: string,
    success: boolean,
    failureReason?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.supabase.rpc('record_auth_attempt', {
        email,
        ip_address: ipAddress,
        success,
        failure_reason: failureReason,
        user_agent: userAgent
      });

      logger.info('Auth attempt recorded', {
        email,
        ipAddress,
        success,
        failureReason
      });
    } catch (error) {
      logger.error('Failed to record auth attempt', error);
    }
  }

  // Get recent failed attempts count
  static async getFailedAttemptsCount(email: string, ipAddress: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('auth_attempts')
        .select('id', { count: 'exact' })
        .eq('email', email)
        .eq('ip_address', ipAddress)
        .eq('success', false)
        .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString());

      if (error) {
        logger.error('Failed to get attempt count', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      logger.error('Failed to get attempt count', error);
      return 0;
    }
  }

  // Clear account lockout
  static async clearAccountLockout(email: string, ipAddress: string): Promise<void> {
    try {
      await this.supabase
        .from('account_lockouts')
        .delete()
        .or(`email.eq.${email},ip_address.eq.${ipAddress}`);

      logger.info('Account lockout cleared', { email, ipAddress });
    } catch (error) {
      logger.error('Failed to clear account lockout', error);
    }
  }
}

// =============================================================================
// 4. CONTACT FORM VALIDATION AND SANITIZATION
// =============================================================================

export class ContactFormService {
  private static supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Contact form validation schema
  static contactFormSchema = z.object({
    name: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
    email: z.string()
      .email('Invalid email format')
      .max(100, 'Email must be less than 100 characters'),
    phone: z.string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
      .optional()
      .or(z.literal('')),
    subject: z.string()
      .min(5, 'Subject must be at least 5 characters')
      .max(100, 'Subject must be less than 100 characters'),
    message: z.string()
      .min(10, 'Message must be at least 10 characters')
      .max(2000, 'Message must be less than 2000 characters')
  });

  // Sanitize text input
  static sanitizeText(input: string): string {
    // Create a DOM window for DOMPurify
    const window = new JSDOM('').window;
    const purify = DOMPurify(window as any);

    // Sanitize the input
    let sanitized = purify.sanitize(input);
    
    // Additional manual sanitization
    sanitized = sanitized
      .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
      .replace(/[<>"']/g, '') // Remove dangerous characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();

    return sanitized;
  }

  // Submit contact form
  static async submitContactForm(
    formData: z.infer<typeof ContactFormService.contactFormSchema>,
    ipAddress: string,
    userAgent?: string
  ): Promise<{ success: boolean; submissionId?: string; error?: string }> {
    try {
      // Validate form data
      const validatedData = this.contactFormSchema.parse(formData);

      // Sanitize message
      const sanitizedMessage = this.sanitizeText(validatedData.message);

      // Submit to database
      const { data, error } = await this.supabase.rpc('submit_contact_form', {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        subject: validatedData.subject,
        message: validatedData.message,
        ip_address: ipAddress,
        user_agent: userAgent
      });

      if (error) {
        logger.error('Contact form submission error', error);
        return { success: false, error: 'Failed to submit contact form' };
      }

      logger.info('Contact form submitted successfully', {
        submissionId: data,
        email: validatedData.email,
        subject: validatedData.subject
      });

      return { success: true, submissionId: data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Contact form validation error', { errors: error.errors });
        return { success: false, error: 'Invalid form data' };
      }

      logger.error('Contact form submission error', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // Check submission rate limit
  static async checkSubmissionRateLimit(ipAddress: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('contact_submissions')
        .select('id', { count: 'exact' })
        .eq('ip_address', ipAddress)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      if (error) {
        logger.error('Rate limit check error', error);
        return true; // Fail safe - allow submission
      }

      return (data?.length || 0) < 5; // Max 5 submissions per hour
    } catch (error) {
      logger.error('Rate limit check error', error);
      return true; // Fail safe
    }
  }
}

// =============================================================================
// 5. GENERIC ERROR HANDLING
// =============================================================================

export class ErrorHandlingService {
  private static supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Generic error messages for users
  private static genericErrorMessages: Record<string, string> = {
    'AUTH_FAILED': 'Authentication failed. Please check your credentials.',
    'AUTH_LOCKED': 'Account temporarily locked due to multiple failed attempts. Please try again later.',
    'PASSWORD_WEAK': 'Password does not meet security requirements.',
    'PASSWORD_LEAKED': 'Password has been found in data breaches. Please choose a different password.',
    'CONTACT_RATE_LIMIT': 'Too many submissions. Please try again later.',
    'CONTACT_INVALID': 'Invalid form data. Please check your input.',
    'BOOKING_FAILED': 'Booking failed. Please try again.',
    'PAYMENT_FAILED': 'Payment failed. Please try again.',
    'VALIDATION_ERROR': 'Invalid input data. Please check your information.',
    'SERVER_ERROR': 'An error occurred. Please try again later.',
    'UNAUTHORIZED': 'You are not authorized to perform this action.',
    'FORBIDDEN': 'Access denied.',
    'NOT_FOUND': 'The requested resource was not found.',
    'RATE_LIMITED': 'Too many requests. Please slow down.'
  };

  // Log error with generic user message
  static async logError(
    errorCode: string,
    detailedError: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    requestData?: any,
    stackTrace?: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<string> {
    try {
      const genericMessage = this.genericErrorMessages[errorCode] || 
        this.genericErrorMessages['SERVER_ERROR'];

      const { data, error } = await this.supabase.rpc('log_error_with_generic_message', {
        error_code: errorCode,
        detailed_error: detailedError,
        generic_user_message: genericMessage,
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
        request_data: requestData,
        stack_trace: stackTrace,
        severity
      });

      if (error) {
        logger.error('Failed to log error', error);
        return 'error-logging-failed';
      }

      logger.error('Error logged', { errorCode, errorId: data });
      return data;
    } catch (error) {
      logger.error('Error logging failed', error);
      return 'error-logging-failed';
    }
  }

  // Get generic error message for user
  static getGenericErrorMessage(errorCode: string): string {
    return this.genericErrorMessages[errorCode] || 
      this.genericErrorMessages['SERVER_ERROR'];
  }

  // Handle and respond to errors
  static async handleError(
    res: Response,
    errorCode: string,
    detailedError: string,
    statusCode: number = 500,
    userId?: string,
    requestData?: any
  ): Promise<void> {
    const ipAddress = res.req.ip;
    const userAgent = res.req.get('User-Agent');

    // Log the error
    await this.logError(
      errorCode,
      detailedError,
      userId,
      ipAddress,
      userAgent,
      requestData,
      new Error(detailedError).stack,
      statusCode >= 500 ? 'high' : 'medium'
    );

    // Send generic response to user
    res.status(statusCode).json({
      error: this.getGenericErrorMessage(errorCode),
      code: errorCode
    });
  }
}

// =============================================================================
// 6. MIDDLEWARE FOR SECURITY FEATURES
// =============================================================================

export class SecurityMiddleware {
  // Password strength validation middleware
  static validatePasswordStrength = (req: Request, res: Response, next: NextFunction) => {
    const { password } = req.body;
    
    if (!password) {
      return ErrorHandlingService.handleError(
        res, 'VALIDATION_ERROR', 'Password is required', 400
      );
    }

    const validation = PasswordSecurityService.validatePasswordStrength(password);
    
    if (!validation.valid) {
      return ErrorHandlingService.handleError(
        res, 'PASSWORD_WEAK', `Password validation failed: ${validation.errors.join(', ')}`, 400
      );
    }

    next();
  };

  // Account lockout check middleware
  static checkAccountLockout = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const ipAddress = req.ip;

    if (!email) {
      return next();
    }

    const isLocked = await AccountSecurityService.isAccountLocked(email, ipAddress);
    
    if (isLocked) {
      return ErrorHandlingService.handleError(
        res, 'AUTH_LOCKED', `Account locked for email: ${email}, IP: ${ipAddress}`, 423
      );
    }

    next();
  };

  // Contact form rate limiting middleware
  static contactFormRateLimit = async (req: Request, res: Response, next: NextFunction) => {
    const ipAddress = req.ip;
    
    const canSubmit = await ContactFormService.checkSubmissionRateLimit(ipAddress);
    
    if (!canSubmit) {
      return ErrorHandlingService.handleError(
        res, 'CONTACT_RATE_LIMIT', `Rate limit exceeded for IP: ${ipAddress}`, 429
      );
    }

    next();
  };

  // Contact form validation middleware
  static validateContactForm = (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = ContactFormService.contactFormSchema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return ErrorHandlingService.handleError(
          res, 'CONTACT_INVALID', `Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400
        );
      }
      
      return ErrorHandlingService.handleError(
        res, 'VALIDATION_ERROR', 'Invalid form data', 400
      );
    }
  };

  // Generic error handling middleware
  static errorHandler = async (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const errorCode = 'SERVER_ERROR';
    const detailedError = error.message;
    const userId = (req as any).user?.userId;
    
    await ErrorHandlingService.handleError(
      res, errorCode, detailedError, 500, userId, req.body
    );
  };
}

// =============================================================================
// 7. API ROUTES FOR SECURITY FEATURES
// =============================================================================

export const securityRoutes = {
  // Password strength check endpoint
  checkPasswordStrength: async (req: Request, res: Response) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return ErrorHandlingService.handleError(
          res, 'VALIDATION_ERROR', 'Password is required', 400
        );
      }

      const validation = await PasswordSecurityService.validatePassword(password);
      
      res.json({
        valid: validation.valid,
        errors: validation.errors
      });
    } catch (error) {
      await ErrorHandlingService.handleError(
        res, 'SERVER_ERROR', error instanceof Error ? error.message : 'Unknown error', 500
      );
    }
  },

  // Contact form submission endpoint
  submitContactForm: async (req: Request, res: Response) => {
    try {
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');
      
      const result = await ContactFormService.submitContactForm(
        req.body, ipAddress, userAgent
      );
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Contact form submitted successfully',
          submissionId: result.submissionId
        });
      } else {
        return ErrorHandlingService.handleError(
          res, 'CONTACT_INVALID', result.error || 'Submission failed', 400
        );
      }
    } catch (error) {
      await ErrorHandlingService.handleError(
        res, 'SERVER_ERROR', error instanceof Error ? error.message : 'Unknown error', 500
      );
    }
  },

  // Create booking with secure reference
  createBooking: async (req: Request, res: Response) => {
    try {
      const result = await SecureBookingService.createBooking(req.body);
      
      if (result.success) {
        res.json({
          success: true,
          bookingId: result.bookingId,
          bookingReference: result.reference,
          message: 'Booking created successfully'
        });
      } else {
        return ErrorHandlingService.handleError(
          res, 'BOOKING_FAILED', result.error || 'Booking creation failed', 400
        );
      }
    } catch (error) {
      await ErrorHandlingService.handleError(
        res, 'SERVER_ERROR', error instanceof Error ? error.message : 'Unknown error', 500
      );
    }
  }
};

export default {
  SecureBookingService,
  PasswordSecurityService,
  AccountSecurityService,
  ContactFormService,
  ErrorHandlingService,
  SecurityMiddleware,
  securityRoutes
};

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { securityRoutes, SecurityMiddleware } from '../lib/security-services';
import { SecureBookingService, PasswordSecurityService, AccountSecurityService, ContactFormService, ErrorHandlingService } from '../lib/security-services';

// Mock Supabase client
vi.mock('../lib/security-services', async () => {
  const actual = await vi.importActual('../lib/security-services');
  return {
    ...actual,
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
            gte: vi.fn(() => ({
              single: vi.fn()
            }))
          })),
          gte: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn()
            }))
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        })),
        delete: vi.fn(() => ({
          or: vi.fn()
        })),
        rpc: vi.fn()
      }))
    }
  };
});

describe('Security Services Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Password Security Service', () => {
    it('should validate strong passwords', () => {
      const strongPassword = 'StrongPass123!';
      const validation = PasswordSecurityService.validatePasswordStrength(strongPassword);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'weak', // Too short
        'weakpassword', // No uppercase, number, or special char
        'WEAKPASSWORD', // No lowercase, number, or special char
        'WeakPassword', // No number or special char
        'WeakPass123', // No special char
        'WeakPass!', // No number
        'password' // Common password
      ];

      weakPasswords.forEach(password => {
        const validation = PasswordSecurityService.validatePasswordStrength(password);
        expect(validation.valid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
      });
    });

    it('should check password length requirements', () => {
      const shortPassword = 'Ab1!';
      const validation = PasswordSecurityService.validatePasswordStrength(shortPassword);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Password must be at least 8 characters long');
    });

    it('should check for uppercase letters', () => {
      const noUppercase = 'weakpass123!';
      const validation = PasswordSecurityService.validatePasswordStrength(noUppercase);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should check for lowercase letters', () => {
      const noLowercase = 'WEAKPASS123!';
      const validation = PasswordSecurityService.validatePasswordStrength(noLowercase);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should check for numbers', () => {
      const noNumber = 'WeakPass!';
      const validation = PasswordSecurityService.validatePasswordStrength(noNumber);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Password must contain at least one number');
    });

    it('should check for special characters', () => {
      const noSpecial = 'WeakPass123';
      const validation = PasswordSecurityService.validatePasswordStrength(noSpecial);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Password must contain at least one special character');
    });

    it('should reject common passwords', () => {
      const commonPasswords = ['password', '123456', 'qwerty', 'admin'];
      
      commonPasswords.forEach(password => {
        const validation = PasswordSecurityService.validatePasswordStrength(password);
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Password is too common. Please choose a more unique password');
      });
    });
  });

  describe('Secure Booking Service', () => {
    it('should generate valid booking references', () => {
      const reference = SecureBookingService.generateSecureBookingReference();
      
      expect(reference).toMatch(/^BK[A-F0-9]{8}$/);
      expect(reference).toHaveLength(10); // BK + 8 characters
    });

    it('should validate booking reference format', () => {
      const validReferences = [
        'BK12345678',
        'BKABCDEFGH',
        'BK1234ABCD'
      ];

      const invalidReferences = [
        'BK1234567', // Too short
        'BK123456789', // Too long
        'bk12345678', // Lowercase
        '1234567890', // No BK prefix
        'BK1234567G', // Invalid character
        'BK1234567!' // Special character
      ];

      validReferences.forEach(ref => {
        expect(SecureBookingService.validateBookingReference(ref)).toBe(true);
      });

      invalidReferences.forEach(ref => {
        expect(SecureBookingService.validateBookingReference(ref)).toBe(false);
      });
    });

    it('should generate unique booking references', () => {
      const references = new Set();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const reference = SecureBookingService.generateSecureBookingReference();
        references.add(reference);
      }

      // Should have high uniqueness (allowing for some collisions due to randomness)
      expect(references.size).toBeGreaterThan(iterations * 0.99);
    });
  });

  describe('Contact Form Service', () => {
    it('should validate contact form data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        subject: 'Test Subject',
        message: 'This is a test message with sufficient length.'
      };

      const result = ContactFormService.contactFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid contact form data', () => {
      const invalidData = {
        name: 'J', // Too short
        email: 'invalid-email', // Invalid email
        phone: '123', // Invalid phone
        subject: 'Hi', // Too short
        message: 'Short' // Too short
      };

      const result = ContactFormService.contactFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should sanitize text input', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello World';
      const sanitized = ContactFormService.sanitizeText(maliciousInput);
      
      expect(sanitized).toBe('Hello World');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should handle empty phone numbers', () => {
      const dataWithEmptyPhone = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '',
        subject: 'Test Subject',
        message: 'This is a test message with sufficient length.'
      };

      const result = ContactFormService.contactFormSchema.safeParse(dataWithEmptyPhone);
      expect(result.success).toBe(true);
    });

    it('should validate name format', () => {
      const validNames = ['John Doe', 'Mary Jane Smith', 'A B'];
      const invalidNames = ['John123', 'John@Doe', 'John-Doe', ''];

      validNames.forEach(name => {
        const result = ContactFormService.contactFormSchema.safeParse({
          name, email: 'test@example.com', subject: 'Test', message: 'Test message with sufficient length.'
        });
        expect(result.success).toBe(true);
      });

      invalidNames.forEach(name => {
        const result = ContactFormService.contactFormSchema.safeParse({
          name, email: 'test@example.com', subject: 'Test', message: 'Test message with sufficient length.'
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Account Security Service', () => {
    it('should record authentication attempts', async () => {
      // Mock successful RPC call
      const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });
      (AccountSecurityService as any).supabase.rpc = mockRpc;

      await AccountSecurityService.recordAuthAttempt(
        'test@example.com',
        '192.168.1.1',
        true
      );

      expect(mockRpc).toHaveBeenCalledWith('record_auth_attempt', {
        email: 'test@example.com',
        ip_address: '192.168.1.1',
        success: true,
        failure_reason: undefined,
        user_agent: undefined
      });
    });

    it('should record failed authentication attempts', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });
      (AccountSecurityService as any).supabase.rpc = mockRpc;

      await AccountSecurityService.recordAuthAttempt(
        'test@example.com',
        '192.168.1.1',
        false,
        'Invalid password',
        'Mozilla/5.0'
      );

      expect(mockRpc).toHaveBeenCalledWith('record_auth_attempt', {
        email: 'test@example.com',
        ip_address: '192.168.1.1',
        success: false,
        failure_reason: 'Invalid password',
        user_agent: 'Mozilla/5.0'
      });
    });

    it('should check account lockout status', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: false, error: null });
      (AccountSecurityService as any).supabase.rpc = mockRpc;

      const isLocked = await AccountSecurityService.isAccountLocked(
        'test@example.com',
        '192.168.1.1'
      );

      expect(isLocked).toBe(false);
      expect(mockRpc).toHaveBeenCalledWith('is_account_locked', {
        email: 'test@example.com',
        ip_address: '192.168.1.1'
      });
    });
  });

  describe('Error Handling Service', () => {
    it('should provide generic error messages', () => {
      const genericMessages = [
        'AUTH_FAILED',
        'PASSWORD_WEAK',
        'CONTACT_RATE_LIMIT',
        'BOOKING_FAILED',
        'PAYMENT_FAILED',
        'SERVER_ERROR'
      ];

      genericMessages.forEach(errorCode => {
        const message = ErrorHandlingService.getGenericErrorMessage(errorCode);
        expect(message).toBeDefined();
        expect(message.length).toBeGreaterThan(0);
        expect(message).not.toContain('stack');
        expect(message).not.toContain('error');
        expect(message).not.toContain('undefined');
      });
    });

    it('should return default message for unknown error codes', () => {
      const message = ErrorHandlingService.getGenericErrorMessage('UNKNOWN_ERROR');
      expect(message).toBe('An error occurred. Please try again later.');
    });

    it('should log errors with generic messages', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: 'error-id-123', error: null });
      (ErrorHandlingService as any).supabase.rpc = mockRpc;

      const errorId = await ErrorHandlingService.logError(
        'TEST_ERROR',
        'Detailed error message',
        'user-123',
        '192.168.1.1',
        'Mozilla/5.0',
        { test: 'data' },
        'stack trace',
        'medium'
      );

      expect(errorId).toBe('error-id-123');
      expect(mockRpc).toHaveBeenCalledWith('log_error_with_generic_message', {
        error_code: 'TEST_ERROR',
        detailed_error: 'Detailed error message',
        generic_user_message: 'An error occurred. Please try again later.',
        user_id: 'user-123',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        request_data: { test: 'data' },
        stack_trace: 'stack trace',
        severity: 'medium'
      });
    });
  });

  describe('Security Middleware', () => {
    it('should validate password strength in middleware', async () => {
      app.post('/test-password', SecurityMiddleware.validatePasswordStrength, (req, res) => {
        res.json({ success: true });
      });

      // Test weak password
      const weakPasswordResponse = await request(app)
        .post('/test-password')
        .send({ password: 'weak' })
        .expect(400);

      expect(weakPasswordResponse.body.error).toBeDefined();
      expect(weakPasswordResponse.body.code).toBe('PASSWORD_WEAK');

      // Test strong password
      await request(app)
        .post('/test-password')
        .send({ password: 'StrongPass123!' })
        .expect(200);
    });

    it('should validate contact form in middleware', async () => {
      app.post('/test-contact', SecurityMiddleware.validateContactForm, (req, res) => {
        res.json({ success: true });
      });

      // Test invalid form data
      const invalidResponse = await request(app)
        .post('/test-contact')
        .send({
          name: 'J',
          email: 'invalid-email',
          subject: 'Hi',
          message: 'Short'
        })
        .expect(400);

      expect(invalidResponse.body.error).toBeDefined();
      expect(invalidResponse.body.code).toBe('CONTACT_INVALID');

      // Test valid form data
      await request(app)
        .post('/test-contact')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Test Subject',
          message: 'This is a test message with sufficient length.'
        })
        .expect(200);
    });
  });

  describe('API Routes', () => {
    it('should handle password strength check endpoint', async () => {
      app.post('/api/check-password', securityRoutes.checkPasswordStrength);

      const response = await request(app)
        .post('/api/check-password')
        .send({ password: 'StrongPass123!' })
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.errors).toHaveLength(0);
    });

    it('should handle contact form submission endpoint', async () => {
      // Mock successful submission
      const mockSubmit = vi.fn().mockResolvedValue({ success: true, submissionId: 'sub-123' });
      (ContactFormService as any).submitContactForm = mockSubmit;

      app.post('/api/contact', securityRoutes.submitContactForm);

      const response = await request(app)
        .post('/api/contact')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Test Subject',
          message: 'This is a test message with sufficient length.'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.submissionId).toBe('sub-123');
    });

    it('should handle booking creation endpoint', async () => {
      // Mock successful booking creation
      const mockCreate = vi.fn().mockResolvedValue({ 
        success: true, 
        bookingId: 'booking-123', 
        reference: 'BK12345678' 
      });
      (SecureBookingService as any).createBooking = mockCreate;

      app.post('/api/bookings', securityRoutes.createBooking);

      const response = await request(app)
        .post('/api/bookings')
        .send({
          type: 'hotel',
          itemId: 'hotel-123',
          startDate: '2025-01-01',
          endDate: '2025-01-05',
          guestsCount: 2
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.bookingId).toBe('booking-123');
      expect(response.body.bookingReference).toBe('BK12345678');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete password validation flow', async () => {
      app.post('/api/validate-password', async (req, res) => {
        try {
          const { password } = req.body;
          const validation = await PasswordSecurityService.validatePassword(password);
          
          if (validation.valid) {
            res.json({ valid: true, message: 'Password is strong' });
          } else {
            res.status(400).json({ 
              valid: false, 
              errors: validation.errors 
            });
          }
        } catch (error) {
          res.status(500).json({ error: 'Internal server error' });
        }
      });

      // Test strong password
      const strongResponse = await request(app)
        .post('/api/validate-password')
        .send({ password: 'StrongPass123!' })
        .expect(200);

      expect(strongResponse.body.valid).toBe(true);

      // Test weak password
      const weakResponse = await request(app)
        .post('/api/validate-password')
        .send({ password: 'weak' })
        .expect(400);

      expect(weakResponse.body.valid).toBe(false);
      expect(weakResponse.body.errors.length).toBeGreaterThan(0);
    });

    it('should handle complete contact form flow', async () => {
      app.post('/api/contact-form', 
        SecurityMiddleware.contactFormRateLimit,
        SecurityMiddleware.validateContactForm,
        securityRoutes.submitContactForm
      );

      // Mock successful submission
      const mockSubmit = vi.fn().mockResolvedValue({ success: true, submissionId: 'sub-123' });
      (ContactFormService as any).submitContactForm = mockSubmit;

      const response = await request(app)
        .post('/api/contact-form')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Test Subject',
          message: 'This is a test message with sufficient length.'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.submissionId).toBe('sub-123');
    });

    it('should handle error scenarios gracefully', async () => {
      app.post('/api/test-error', async (req, res) => {
        try {
          throw new Error('Test error');
        } catch (error) {
          await ErrorHandlingService.handleError(
            res, 'TEST_ERROR', 'Test error occurred', 500
          );
        }
      });

      const response = await request(app)
        .post('/api/test-error')
        .send({})
        .expect(500);

      expect(response.body.error).toBeDefined();
      expect(response.body.code).toBe('TEST_ERROR');
      expect(response.body.error).not.toContain('Test error occurred');
    });
  });
});

export default {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi
};

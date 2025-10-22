import crypto from 'crypto-js';
import DOMPurify from 'dompurify';

// Security configuration
export const SECURITY_CONFIG = {
  // Encryption settings
  ENCRYPTION_KEY: import.meta.env.VITE_ENCRYPTION_KEY || 'default-key-change-in-production',
  ENCRYPTION_ALGORITHM: 'AES-256-CBC',
  
  // Session settings
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  REFRESH_TOKEN_TIMEOUT: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Rate limiting
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS_PER_WINDOW: 100,
  
  // Password requirements
  MIN_PASSWORD_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  
  // PCI DSS requirements
  PCI_TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  PCI_DATA_RETENTION_DAYS: 30,
  
  // GDPR settings
  GDPR_CONSENT_EXPIRY: 365 * 24 * 60 * 60 * 1000, // 1 year
  DATA_RETENTION_PERIOD: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
};

// Data encryption utilities
export class EncryptionService {
  private static key = SECURITY_CONFIG.ENCRYPTION_KEY;

  static encrypt(data: string): string {
    try {
      return crypto.AES.encrypt(data, this.key).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  static decrypt(encryptedData: string): string {
    try {
      const bytes = crypto.AES.decrypt(encryptedData, this.key);
      return bytes.toString(crypto.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  static hash(data: string): string {
    return crypto.SHA256(data).toString();
  }

  static generateToken(): string {
    return crypto.lib.WordArray.random(32).toString();
  }

  static generateSecureRandom(length: number = 32): string {
    return crypto.lib.WordArray.random(length).toString();
  }
}

// Input validation and sanitization
export class ValidationService {
  static sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input);
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < SECURITY_CONFIG.MIN_PASSWORD_LENGTH) {
      errors.push(`Password must be at least ${SECURITY_CONFIG.MIN_PASSWORD_LENGTH} characters long`);
    }
    
    if (SECURITY_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (SECURITY_CONFIG.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (SECURITY_CONFIG.REQUIRE_NUMBERS && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (SECURITY_CONFIG.REQUIRE_SPECIAL_CHARS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateCreditCard(cardNumber: string): boolean {
    // Remove spaces and non-digits
    const cleaned = cardNumber.replace(/\D/g, '');
    
    // Check length (13-19 digits)
    if (cleaned.length < 13 || cleaned.length > 19) {
      return false;
    }
    
    // Luhn algorithm validation
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return this.sanitizeHtml(input.trim());
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }
}

// PCI DSS compliance utilities
export class PCIComplianceService {
  static maskCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length < 4) return '****';
    
    const lastFour = cleaned.slice(-4);
    const masked = '*'.repeat(cleaned.length - 4);
    return masked + lastFour;
  }

  static maskCVV(cvv: string): string {
    return '***';
  }

  static validatePCICompliance(data: any): { isCompliant: boolean; violations: string[] } {
    const violations: string[] = [];
    
    // Check for sensitive data in logs
    if (JSON.stringify(data).includes('card_number') || 
        JSON.stringify(data).includes('cvv') || 
        JSON.stringify(data).includes('pin')) {
      violations.push('Sensitive payment data detected in non-secure context');
    }
    
    // Check data retention
    const now = new Date();
    const dataAge = now.getTime() - (data.created_at ? new Date(data.created_at).getTime() : 0);
    if (dataAge > SECURITY_CONFIG.PCI_DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000) {
      violations.push('Data exceeds PCI retention period');
    }
    
    return {
      isCompliant: violations.length === 0,
      violations
    };
  }

  static generateTransactionId(): string {
    const timestamp = Date.now().toString();
    const random = EncryptionService.generateSecureRandom(16);
    return `txn_${timestamp}_${random}`;
  }
}

// GDPR compliance utilities
export class GDPRComplianceService {
  static generateConsentId(): string {
    return `consent_${Date.now()}_${EncryptionService.generateSecureRandom(16)}`;
  }

  static validateConsent(consent: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!consent.user_id) {
      errors.push('User ID is required for consent');
    }
    
    if (!consent.consent_type) {
      errors.push('Consent type is required');
    }
    
    if (!consent.given_at) {
      errors.push('Consent timestamp is required');
    }
    
    if (consent.expires_at && new Date(consent.expires_at) < new Date()) {
      errors.push('Consent has expired');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static checkDataRetention(data: any): boolean {
    const now = new Date();
    const dataAge = now.getTime() - (data.created_at ? new Date(data.created_at).getTime() : 0);
    return dataAge <= SECURITY_CONFIG.DATA_RETENTION_PERIOD;
  }

  static generateDataExport(userId: string): any {
    return {
      user_id: userId,
      export_id: `export_${Date.now()}_${EncryptionService.generateSecureRandom(16)}`,
      requested_at: new Date().toISOString(),
      status: 'pending'
    };
  }
}

// Session security utilities
export class SessionSecurityService {
  static generateSessionId(): string {
    return `sess_${Date.now()}_${EncryptionService.generateSecureRandom(32)}`;
  }

  static generateCSRFToken(): string {
    return EncryptionService.generateSecureRandom(32);
  }

  static validateSession(session: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!session.id) {
      errors.push('Session ID is required');
    }
    
    if (!session.user_id) {
      errors.push('User ID is required');
    }
    
    if (!session.created_at) {
      errors.push('Session creation timestamp is required');
    }
    
    const now = new Date();
    const sessionAge = now.getTime() - new Date(session.created_at).getTime();
    
    if (sessionAge > SECURITY_CONFIG.SESSION_TIMEOUT) {
      errors.push('Session has expired');
    }
    
    if (session.last_activity) {
      const lastActivityAge = now.getTime() - new Date(session.last_activity).getTime();
      if (lastActivityAge > SECURITY_CONFIG.SESSION_TIMEOUT) {
        errors.push('Session inactive for too long');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static encryptSessionData(data: any): string {
    return EncryptionService.encrypt(JSON.stringify(data));
  }

  static decryptSessionData(encryptedData: string): any {
    try {
      return JSON.parse(EncryptionService.decrypt(encryptedData));
    } catch (error) {
      throw new Error('Invalid session data');
    }
  }
}

// Rate limiting utilities
export class RateLimitService {
  private static requests: Map<string, { count: number; resetTime: number }> = new Map();

  static checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowStart = now - SECURITY_CONFIG.RATE_LIMIT_WINDOW;
    
    const current = this.requests.get(identifier);
    
    if (!current || current.resetTime < windowStart) {
      // New window or expired window
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW
      });
      
      return {
        allowed: true,
        remaining: SECURITY_CONFIG.MAX_REQUESTS_PER_WINDOW - 1,
        resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW
      };
    }
    
    if (current.count >= SECURITY_CONFIG.MAX_REQUESTS_PER_WINDOW) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime
      };
    }
    
    current.count++;
    this.requests.set(identifier, current);
    
    return {
      allowed: true,
      remaining: SECURITY_CONFIG.MAX_REQUESTS_PER_WINDOW - current.count,
      resetTime: current.resetTime
    };
  }

  static resetRateLimit(identifier: string): void {
    this.requests.delete(identifier);
  }
}

// Security headers utilities
export class SecurityHeadersService {
  static getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Content-Security-Policy': this.getCSPHeader(),
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    };
  }

  private static getCSPHeader(): string {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const allowedOrigins = [
      "'self'",
      baseUrl,
      'https://api.razorpay.com',
      'https://checkout.razorpay.com',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ].join(' ');

    return [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' ${allowedOrigins}`,
      `style-src 'self' 'unsafe-inline' ${allowedOrigins}`,
      `img-src 'self' data: https: ${allowedOrigins}`,
      `font-src 'self' ${allowedOrigins}`,
      `connect-src 'self' ${allowedOrigins}`,
      `frame-src 'self' https://checkout.razorpay.com`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
    ].join('; ');
  }
}

// Fraud detection utilities
export class FraudDetectionService {
  static detectSuspiciousActivity(activity: any): { isSuspicious: boolean; riskScore: number; reasons: string[] } {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check for rapid successive requests
    if (activity.requestCount > 10 && activity.timeWindow < 60000) { // 10 requests in 1 minute
      riskScore += 30;
      reasons.push('High request frequency detected');
    }

    // Check for unusual IP patterns
    if (activity.ipAddress && this.isSuspiciousIP(activity.ipAddress)) {
      riskScore += 25;
      reasons.push('Suspicious IP address detected');
    }

    // Check for unusual user agent
    if (activity.userAgent && this.isSuspiciousUserAgent(activity.userAgent)) {
      riskScore += 20;
      reasons.push('Suspicious user agent detected');
    }

    // Check for unusual location patterns
    if (activity.location && this.isSuspiciousLocation(activity.location)) {
      riskScore += 15;
      reasons.push('Unusual location pattern detected');
    }

    // Check for payment anomalies
    if (activity.paymentAmount && this.isSuspiciousPayment(activity.paymentAmount)) {
      riskScore += 25;
      reasons.push('Suspicious payment amount detected');
    }

    return {
      isSuspicious: riskScore > 50,
      riskScore,
      reasons
    };
  }

  private static isSuspiciousIP(ip: string): boolean {
    // Simple IP blacklist check (in production, use a proper IP reputation service)
    const suspiciousIPs = [
      '127.0.0.1', // Localhost (should not be used in production)
      '0.0.0.0',   // Invalid IP
    ];
    
    return suspiciousIPs.includes(ip);
  }

  private static isSuspiciousUserAgent(userAgent: string): boolean {
    // Check for automated tools or suspicious patterns
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  private static isSuspiciousLocation(location: any): boolean {
    // Check for impossible travel patterns
    if (location.previousLocation && location.currentLocation) {
      const distance = this.calculateDistance(
        location.previousLocation.lat,
        location.previousLocation.lng,
        location.currentLocation.lat,
        location.currentLocation.lng
      );
      
      const timeDiff = location.currentTime - location.previousTime;
      const maxSpeed = 1000; // km/h (reasonable for air travel)
      
      if (distance / (timeDiff / 3600000) > maxSpeed) {
        return true;
      }
    }
    
    return false;
  }

  private static isSuspiciousPayment(amount: number): boolean {
    // Check for unusual payment amounts
    if (amount <= 0) return true;
    if (amount > 1000000) return true; // Very high amount
    if (amount % 1 !== 0 && amount < 10) return true; // Suspicious decimal amounts
    
    return false;
  }

  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

export default {
  EncryptionService,
  ValidationService,
  PCIComplianceService,
  GDPRComplianceService,
  SessionSecurityService,
  RateLimitService,
  SecurityHeadersService,
  FraudDetectionService,
  SECURITY_CONFIG
};

// Security Configuration for Anagha Safaar
// This file contains all security-related environment variables and configuration
// NOTE: Server-side secrets (ENCRYPTION_KEY, JWT_SECRET, RECAPTCHA_SECRET_KEY) 
// must ONLY be used in Edge Functions, never in client-side code

export const SECURITY_ENV = {
  // reCAPTCHA Configuration (only site key is safe for client-side)
  RECAPTCHA_SITE_KEY: import.meta.env.VITE_RECAPTCHA_SITE_KEY || '',
  RECAPTCHA_VERSION: import.meta.env.VITE_RECAPTCHA_VERSION || 'v3',
  
  // Rate Limiting (client-side settings only)
  RATE_LIMIT_WINDOW_MS: parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(import.meta.env.VITE_RATE_LIMIT_MAX_REQUESTS || '100'),
  
  // Session Security (timeout values are safe for client-side)
  SESSION_TIMEOUT_MS: parseInt(import.meta.env.VITE_SESSION_TIMEOUT_MS || '1800000'), // 30 minutes
  REFRESH_TOKEN_TIMEOUT_MS: parseInt(import.meta.env.VITE_REFRESH_TOKEN_TIMEOUT_MS || '604800000'), // 7 days
  
  // Password Security (validation rules are safe for client-side)
  MIN_PASSWORD_LENGTH: parseInt(import.meta.env.VITE_MIN_PASSWORD_LENGTH || '8'),
  REQUIRE_PASSWORD_COMPLEXITY: import.meta.env.VITE_REQUIRE_PASSWORD_COMPLEXITY === 'true',
  
  // Two-Factor Authentication
  TWO_FACTOR_ENABLED: import.meta.env.VITE_TWO_FACTOR_ENABLED === 'true',
  TWO_FACTOR_ISSUER: import.meta.env.VITE_TWO_FACTOR_ISSUER || 'Anagha Safaar',
  
  // Fraud Detection
  FRAUD_DETECTION_ENABLED: import.meta.env.VITE_FRAUD_DETECTION_ENABLED === 'true',
  FRAUD_RISK_THRESHOLD: parseInt(import.meta.env.VITE_FRAUD_RISK_THRESHOLD || '70'),
  
  // PCI Compliance (retention settings are safe for client-side)
  PCI_DATA_RETENTION_DAYS: parseInt(import.meta.env.VITE_PCI_DATA_RETENTION_DAYS || '30'),
  PCI_TOKEN_EXPIRY_HOURS: parseInt(import.meta.env.VITE_PCI_TOKEN_EXPIRY_HOURS || '24'),
  
  // GDPR Compliance
  GDPR_CONSENT_EXPIRY_DAYS: parseInt(import.meta.env.VITE_GDPR_CONSENT_EXPIRY_DAYS || '365'),
  DATA_RETENTION_YEARS: parseInt(import.meta.env.VITE_DATA_RETENTION_YEARS || '7'),
  
  // Security Headers
  CSP_ENABLED: import.meta.env.VITE_CSP_ENABLED === 'true',
  HSTS_ENABLED: import.meta.env.VITE_HSTS_ENABLED === 'true',
  
  // Monitoring and Logging
  SECURITY_LOGGING_ENABLED: import.meta.env.VITE_SECURITY_LOGGING_ENABLED === 'true',
  AUDIT_LOG_RETENTION_DAYS: parseInt(import.meta.env.VITE_AUDIT_LOG_RETENTION_DAYS || '365'),
  
  // API Security
  API_KEY_REQUIRED: import.meta.env.VITE_API_KEY_REQUIRED === 'true',
  API_RATE_LIMIT_ENABLED: import.meta.env.VITE_API_RATE_LIMIT_ENABLED === 'true',
  
  // Environment
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  IS_PRODUCTION: import.meta.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: import.meta.env.NODE_ENV === 'development',
};

// Security Policy Configuration
export const SECURITY_POLICIES = {
  // Password Policy
  PASSWORD: {
    MIN_LENGTH: SECURITY_ENV.MIN_PASSWORD_LENGTH,
    REQUIRE_UPPERCASE: SECURITY_ENV.REQUIRE_PASSWORD_COMPLEXITY,
    REQUIRE_LOWERCASE: SECURITY_ENV.REQUIRE_PASSWORD_COMPLEXITY,
    REQUIRE_NUMBERS: SECURITY_ENV.REQUIRE_PASSWORD_COMPLEXITY,
    REQUIRE_SPECIAL_CHARS: SECURITY_ENV.REQUIRE_PASSWORD_COMPLEXITY,
    MAX_AGE_DAYS: 90,
    HISTORY_COUNT: 5,
  },
  
  // Account Lockout Policy
  ACCOUNT_LOCKOUT: {
    MAX_ATTEMPTS: 5,
    LOCKOUT_DURATION_MINUTES: 30,
    RESET_ATTEMPTS_AFTER_MINUTES: 15,
  },
  
  // Session Policy
  SESSION: {
    TIMEOUT_MINUTES: SECURITY_ENV.SESSION_TIMEOUT_MS / 60000,
    MAX_CONCURRENT_SESSIONS: 3,
    INACTIVITY_TIMEOUT_MINUTES: 15,
    REFRESH_THRESHOLD_MINUTES: 5,
  },
  
  // Rate Limiting Policy
  RATE_LIMITING: {
    WINDOW_MINUTES: SECURITY_ENV.RATE_LIMIT_WINDOW_MS / 60000,
    MAX_REQUESTS: SECURITY_ENV.RATE_LIMIT_MAX_REQUESTS,
    BURST_LIMIT: 20,
    COOLDOWN_MINUTES: 5,
  },
  
  // Fraud Detection Policy
  FRAUD_DETECTION: {
    ENABLED: SECURITY_ENV.FRAUD_DETECTION_ENABLED,
    RISK_THRESHOLD: SECURITY_ENV.FRAUD_RISK_THRESHOLD,
    HIGH_RISK_THRESHOLD: 80,
    MEDIUM_RISK_THRESHOLD: 50,
    LOW_RISK_THRESHOLD: 30,
    BLOCK_HIGH_RISK: true,
    REQUIRE_VERIFICATION_MEDIUM_RISK: true,
  },
  
  // PCI DSS Policy
  PCI_DSS: {
    DATA_RETENTION_DAYS: SECURITY_ENV.PCI_DATA_RETENTION_DAYS,
    TOKEN_EXPIRY_HOURS: SECURITY_ENV.PCI_TOKEN_EXPIRY_HOURS,
    ENCRYPTION_REQUIRED: true,
    AUDIT_REQUIRED: true,
    ACCESS_CONTROL_REQUIRED: true,
  },
  
  // GDPR Policy
  GDPR: {
    CONSENT_EXPIRY_DAYS: SECURITY_ENV.GDPR_CONSENT_EXPIRY_DAYS,
    DATA_RETENTION_YEARS: SECURITY_ENV.DATA_RETENTION_YEARS,
    RIGHT_TO_ACCESS: true,
    RIGHT_TO_RECTIFICATION: true,
    RIGHT_TO_ERASURE: true,
    RIGHT_TO_PORTABILITY: true,
    RIGHT_TO_OBJECT: true,
    RIGHT_TO_RESTRICT_PROCESSING: true,
  },
  
  // Security Headers Policy
  SECURITY_HEADERS: {
    CSP_ENABLED: SECURITY_ENV.CSP_ENABLED,
    HSTS_ENABLED: SECURITY_ENV.HSTS_ENABLED,
    X_FRAME_OPTIONS: 'DENY',
    X_CONTENT_TYPE_OPTIONS: 'nosniff',
    X_XSS_PROTECTION: '1; mode=block',
    REFERRER_POLICY: 'strict-origin-when-cross-origin',
    PERMISSIONS_POLICY: 'geolocation=(), microphone=(), camera=()',
  },
};

// Content Security Policy Configuration
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vite in development
    'https://www.google.com',
    'https://www.gstatic.com',
    'https://checkout.razorpay.com',
    'https://api.razorpay.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'",
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'https:',
    'blob:',
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
  ],
  'connect-src': [
    "'self'",
    'https://api.supabase.co',
    'https://api.razorpay.com',
    'https://www.google.com',
    'https://api.ipify.org',
  ],
  'frame-src': [
    "'self'",
    'https://checkout.razorpay.com',
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

// Security Event Types
export const SECURITY_EVENT_TYPES = {
  // Authentication Events
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  LOGOUT_FAILED: 'logout_failed',
  SIGNUP_SUCCESS: 'signup_success',
  SIGNUP_FAILED: 'signup_failed',
  PASSWORD_CHANGED: 'password_changed',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',
  PASSWORD_RESET_COMPLETED: 'password_reset_completed',
  
  // Account Security Events
  ACCOUNT_LOCKED: 'account_locked',
  ACCOUNT_UNLOCKED: 'account_unlocked',
  TWO_FACTOR_ENABLED: 'two_factor_enabled',
  TWO_FACTOR_DISABLED: 'two_factor_disabled',
  TWO_FACTOR_VERIFIED: 'two_factor_verified',
  TWO_FACTOR_FAILED: 'two_factor_failed',
  
  // Fraud Detection Events
  FRAUD_DETECTED: 'fraud_detected',
  HIGH_RISK_ACTIVITY: 'high_risk_activity',
  SUSPICIOUS_LOGIN: 'suspicious_login',
  UNUSUAL_LOCATION: 'unusual_location',
  RAPID_REQUESTS: 'rapid_requests',
  
  // Data Access Events
  DATA_ACCESSED: 'data_accessed',
  DATA_EXPORTED: 'data_exported',
  DATA_DELETED: 'data_deleted',
  CONSENT_GIVEN: 'consent_given',
  CONSENT_WITHDRAWN: 'consent_withdrawn',
  
  // Payment Security Events
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_REFUNDED: 'payment_refunded',
  PAYMENT_TOKEN_CREATED: 'payment_token_created',
  PAYMENT_TOKEN_EXPIRED: 'payment_token_expired',
  
  // System Security Events
  SECURITY_CONFIG_CHANGED: 'security_config_changed',
  ADMIN_ACCESS: 'admin_access',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SESSION_EXPIRED: 'session_expired',
  SESSION_HIJACKED: 'session_hijacked',
  
  // Cleanup Events
  CLEANUP_COMPLETED: 'cleanup_completed',
  EXPIRED_DATA_DELETED: 'expired_data_deleted',
  AUDIT_LOG_ROTATED: 'audit_log_rotated',
};

// Security Severity Levels
export const SECURITY_SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

// Fraud Detection Flags
export const FRAUD_FLAGS = {
  HIGH_REQUEST_FREQUENCY: 'high_request_frequency',
  SUSPICIOUS_IP: 'suspicious_ip',
  SUSPICIOUS_USER_AGENT: 'suspicious_user_agent',
  UNUSUAL_LOCATION: 'unusual_location',
  SUSPICIOUS_PAYMENT: 'suspicious_payment',
  RAPID_LOGIN_ATTEMPTS: 'rapid_login_attempts',
  UNUSUAL_BEHAVIOR: 'unusual_behavior',
  BOT_DETECTED: 'bot_detected',
  PROXY_DETECTED: 'proxy_detected',
  VPN_DETECTED: 'vpn_detected',
} as const;

// Data Categories for GDPR
export const DATA_CATEGORIES = {
  PROFILE_INFORMATION: 'profile_information',
  CONTACT_INFORMATION: 'contact_information',
  BOOKING_DATA: 'booking_data',
  PAYMENT_DATA: 'payment_data',
  COMMUNICATION_RECORDS: 'communication_records',
  PREFERENCES: 'preferences',
  ANALYTICS_DATA: 'analytics_data',
  SECURITY_DATA: 'security_data',
  AUDIT_DATA: 'audit_data',
} as const;

// Consent Types for GDPR
export const CONSENT_TYPES = {
  MARKETING: 'marketing',
  ANALYTICS: 'analytics',
  FUNCTIONAL: 'functional',
  NECESSARY: 'necessary',
  THIRD_PARTY: 'third_party',
  DATA_PROCESSING: 'data_processing',
  DATA_SHARING: 'data_sharing',
} as const;

// Export all configurations
export default {
  SECURITY_ENV,
  SECURITY_POLICIES,
  CSP_CONFIG,
  SECURITY_EVENT_TYPES,
  SECURITY_SEVERITY,
  FRAUD_FLAGS,
  DATA_CATEGORIES,
  CONSENT_TYPES,
};

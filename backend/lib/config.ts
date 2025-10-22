import { z } from 'zod';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// =============================================================================
// 1. ENVIRONMENT VALIDATION SCHEMA
// =============================================================================

const envSchema = z.object({
  // Application Configuration
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().default('3000'),
  API_VERSION: z.string().default('v1'),
  
  // Database Configuration
  SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Payment Gateway Configuration
  RAZORPAY_KEY_ID: z.string().min(1, 'Razorpay key ID is required'),
  RAZORPAY_KEY_SECRET: z.string().min(1, 'Razorpay key secret is required'),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1, 'Razorpay webhook secret is required'),
  
  // Email Service Configuration
  SENDGRID_API_KEY: z.string().min(1, 'SendGrid API key is required'),
  SENDGRID_FROM_EMAIL: z.string().email('Invalid SendGrid from email'),
  SENDGRID_FROM_NAME: z.string().default('Anagha Safaar'),
  
  // SMS Service Configuration
  TWILIO_ACCOUNT_SID: z.string().min(1, 'Twilio account SID is required'),
  TWILIO_AUTH_TOKEN: z.string().min(1, 'Twilio auth token is required'),
  TWILIO_PHONE_NUMBER: z.string().min(1, 'Twilio phone number is required'),
  
  // Security Configuration
  ENCRYPTION_KEY: z.string().length(32, 'Encryption key must be exactly 32 characters'),
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
  
  // Rate Limiting Configuration
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  
  // CORS Configuration
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  
  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_TO_FILE: z.string().default('true'),
  LOG_FILE_PATH: z.string().default('./logs'),
  
  // Monitoring Configuration
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().default('development'),
  SENTRY_ENABLED: z.string().default('false'),
  
  // Redis Configuration (for caching and sessions)
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default('0'),
  
  // External API Configuration
  AMADEUS_API_KEY: z.string().optional(),
  AMADEUS_API_SECRET: z.string().optional(),
  RATEHAWK_API_KEY: z.string().optional(),
  TBO_API_KEY: z.string().optional(),
  TBO_API_SECRET: z.string().optional(),
  
  // Feature Flags
  FEATURE_DYNAMIC_PRICING: z.string().default('true'),
  FEATURE_REAL_TIME_AVAILABILITY: z.string().default('true'),
  FEATURE_ADVANCED_SEARCH: z.string().default('true'),
  FEATURE_RECOMMENDATIONS: z.string().default('true'),
  FEATURE_SOCIAL_LOGIN: z.string().default('false'),
  FEATURE_WISHLIST: z.string().default('true'),
  FEATURE_REVIEWS: z.string().default('true'),
  FEATURE_CHAT_SUPPORT: z.string().default('false'),
  
  // Security Features
  SECURITY_ENABLE_CAPTCHA: z.string().default('true'),
  SECURITY_ENABLE_FRAUD_DETECTION: z.string().default('true'),
  SECURITY_ENABLE_RATE_LIMITING: z.string().default('true'),
  SECURITY_ENABLE_AUDIT_LOGGING: z.string().default('true'),
  
  // Compliance Configuration
  GDPR_ENABLED: z.string().default('true'),
  PCI_COMPLIANCE_ENABLED: z.string().default('true'),
  DATA_RETENTION_DAYS: z.string().default('2555'), // 7 years
  
  // Performance Configuration
  CACHE_TTL_DEFAULT: z.string().default('3600'),
  CACHE_TTL_BOOKING: z.string().default('900'),
  CACHE_TTL_PRICING: z.string().default('300'),
  
  // Backup Configuration
  BACKUP_ENABLED: z.string().default('true'),
  BACKUP_SCHEDULE: z.string().default('0 2 * * *'), // Daily at 2 AM
  BACKUP_RETENTION_DAYS: z.string().default('30'),
});

// =============================================================================
// 2. ENVIRONMENT VALIDATION AND LOADING
// =============================================================================

export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: z.infer<typeof envSchema>;
  private secrets: Map<string, string> = new Map();

  private constructor() {
    this.loadEnvironment();
    this.validateEnvironment();
    this.loadSecrets();
  }

  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  private loadEnvironment(): void {
    // Load from .env file if it exists
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');
      
      for (const line of envLines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          const value = valueParts.join('=');
          if (key && value) {
            process.env[key.trim()] = value.trim();
          }
        }
      }
    }

    // Load from .env.local if it exists (higher priority)
    const envLocalPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envLocalPath)) {
      const envContent = fs.readFileSync(envLocalPath, 'utf8');
      const envLines = envContent.split('\n');
      
      for (const line of envLines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          const value = valueParts.join('=');
          if (key && value) {
            process.env[key.trim()] = value.trim();
          }
        }
      }
    }
  }

  private validateEnvironment(): void {
    try {
      this.config = envSchema.parse(process.env);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ Environment validation failed:');
        error.errors.forEach((err) => {
          console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
        process.exit(1);
      }
      throw error;
    }
  }

  private loadSecrets(): void {
    // Load secrets from environment variables
    const secretKeys = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'ENCRYPTION_KEY',
      'SESSION_SECRET',
      'RAZORPAY_KEY_SECRET',
      'RAZORPAY_WEBHOOK_SECRET',
      'SENDGRID_API_KEY',
      'TWILIO_AUTH_TOKEN',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    for (const key of secretKeys) {
      const value = process.env[key];
      if (value) {
        this.secrets.set(key, value);
      }
    }
  }

  public getConfig(): z.infer<typeof envSchema> {
    return this.config;
  }

  public getSecret(key: string): string | undefined {
    return this.secrets.get(key);
  }

  public isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  public isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  public isStaging(): boolean {
    return this.config.NODE_ENV === 'staging';
  }

  public getFeatureFlag(flag: string): boolean {
    const value = process.env[`FEATURE_${flag.toUpperCase()}`];
    return value === 'true';
  }

  public getSecuritySetting(setting: string): boolean {
    const value = process.env[`SECURITY_${setting.toUpperCase()}`];
    return value === 'true';
  }
}

// =============================================================================
// 3. SECRETS MANAGEMENT
// =============================================================================

export class SecretsManager {
  private static instance: SecretsManager;
  private encryptedSecrets: Map<string, string> = new Map();
  private masterKey: string;

  private constructor() {
    this.masterKey = EnvironmentManager.getInstance().getSecret('ENCRYPTION_KEY') || '';
    this.loadEncryptedSecrets();
  }

  public static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }

  private loadEncryptedSecrets(): void {
    // Load encrypted secrets from secure storage
    // In production, this would be from a secure key management service
    const secretsPath = path.join(process.cwd(), 'secrets');
    if (fs.existsSync(secretsPath)) {
      const files = fs.readdirSync(secretsPath);
      for (const file of files) {
        if (file.endsWith('.encrypted')) {
          const key = file.replace('.encrypted', '');
          const encryptedValue = fs.readFileSync(path.join(secretsPath, file), 'utf8');
          this.encryptedSecrets.set(key, encryptedValue);
        }
      }
    }
  }

  public encryptSecret(secret: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', this.masterKey);
    cipher.setAAD(Buffer.from('anagha-safaar-secrets', 'utf8'));
    
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  public decryptSecret(encryptedSecret: string): string {
    const parts = encryptedSecret.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher('aes-256-gcm', this.masterKey);
    decipher.setAAD(Buffer.from('anagha-safaar-secrets', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  public getSecret(key: string): string | undefined {
    // First try environment variable
    const envValue = process.env[key];
    if (envValue) {
      return envValue;
    }

    // Then try encrypted secrets
    const encryptedValue = this.encryptedSecrets.get(key);
    if (encryptedValue) {
      try {
        return this.decryptSecret(encryptedValue);
      } catch (error) {
        console.error(`Failed to decrypt secret ${key}:`, error);
        return undefined;
      }
    }

    return undefined;
  }

  public storeSecret(key: string, value: string): void {
    const encryptedValue = this.encryptSecret(value);
    this.encryptedSecrets.set(key, encryptedValue);
    
    // Store in file system (in production, use secure key management service)
    const secretsPath = path.join(process.cwd(), 'secrets');
    if (!fs.existsSync(secretsPath)) {
      fs.mkdirSync(secretsPath, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(secretsPath, `${key}.encrypted`),
      encryptedValue,
      { mode: 0o600 } // Read/write for owner only
    );
  }

  public rotateSecret(key: string): string {
    const currentValue = this.getSecret(key);
    if (!currentValue) {
      throw new Error(`Secret ${key} not found`);
    }

    // Generate new secret
    const newValue = crypto.randomBytes(32).toString('hex');
    
    // Store new secret
    this.storeSecret(key, newValue);
    
    return newValue;
  }

  public listSecrets(): string[] {
    return Array.from(this.encryptedSecrets.keys());
  }
}

// =============================================================================
// 4. CONFIGURATION VALIDATION
// =============================================================================

export class ConfigurationValidator {
  public static validateAll(): void {
    const envManager = EnvironmentManager.getInstance();
    const config = envManager.getConfig();

    // Validate required secrets
    this.validateSecrets();
    
    // Validate external service configurations
    this.validateExternalServices(config);
    
    // Validate security configurations
    this.validateSecurityConfig(config);
    
    // Validate database connections
    this.validateDatabaseConfig(config);
    
    console.log('✅ All configuration validations passed');
  }

  private static validateSecrets(): void {
    const secretsManager = SecretsManager.getInstance();
    const requiredSecrets = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'ENCRYPTION_KEY',
      'SESSION_SECRET',
      'RAZORPAY_KEY_SECRET',
      'RAZORPAY_WEBHOOK_SECRET',
      'SENDGRID_API_KEY',
      'TWILIO_AUTH_TOKEN'
    ];

    for (const secret of requiredSecrets) {
      const value = secretsManager.getSecret(secret);
      if (!value) {
        throw new Error(`Required secret ${secret} is not configured`);
      }
    }
  }

  private static validateExternalServices(config: z.infer<typeof envSchema>): void {
    // Validate Razorpay configuration
    if (!config.RAZORPAY_KEY_ID.startsWith('rzp_')) {
      throw new Error('Invalid Razorpay key ID format');
    }

    // Validate SendGrid configuration
    if (!config.SENDGRID_API_KEY.startsWith('SG.')) {
      throw new Error('Invalid SendGrid API key format');
    }

    // Validate Twilio configuration
    if (!config.TWILIO_ACCOUNT_SID.startsWith('AC')) {
      throw new Error('Invalid Twilio account SID format');
    }
  }

  private static validateSecurityConfig(config: z.infer<typeof envSchema>): void {
    // Validate JWT secrets are different
    if (config.JWT_SECRET === config.JWT_REFRESH_SECRET) {
      throw new Error('JWT secret and refresh secret must be different');
    }

    // Validate encryption key length
    if (config.ENCRYPTION_KEY.length !== 32) {
      throw new Error('Encryption key must be exactly 32 characters');
    }

    // Validate session secret length
    if (config.SESSION_SECRET.length < 32) {
      throw new Error('Session secret must be at least 32 characters');
    }
  }

  private static validateDatabaseConfig(config: z.infer<typeof envSchema>): void {
    // Validate Supabase URL format
    if (!config.SUPABASE_URL.includes('supabase.co')) {
      throw new Error('Invalid Supabase URL format');
    }

    // Validate Supabase keys format
    if (!config.SUPABASE_ANON_KEY.startsWith('eyJ')) {
      throw new Error('Invalid Supabase anon key format');
    }

    if (!config.SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ')) {
      throw new Error('Invalid Supabase service role key format');
    }
  }
}

// =============================================================================
// 5. CONFIGURATION UTILITIES
// =============================================================================

export class ConfigurationUtils {
  public static generateSecureKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  public static generateJWTSecret(): string {
    return this.generateSecureKey(32);
  }

  public static generateEncryptionKey(): string {
    return this.generateSecureKey(16); // 16 bytes = 32 hex chars
  }

  public static generateSessionSecret(): string {
    return this.generateSecureKey(32);
  }

  public static maskSensitiveValue(value: string, visibleChars: number = 4): string {
    if (value.length <= visibleChars) {
      return '*'.repeat(value.length);
    }
    
    const visible = value.substring(0, visibleChars);
    const masked = '*'.repeat(value.length - visibleChars);
    
    return visible + masked;
  }

  public static createEnvironmentTemplate(): string {
    return `# Anagha Safaar Environment Configuration
# Copy this file to .env.local and fill in your actual values

# Application Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=${this.generateJWTSecret()}
JWT_REFRESH_SECRET=${this.generateJWTSecret()}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Payment Gateway Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Email Service Configuration
SENDGRID_API_KEY=SG.your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@anaghasafaar.com
SENDGRID_FROM_NAME=Anagha Safaar

# SMS Service Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Security Configuration
ENCRYPTION_KEY=${this.generateEncryptionKey()}
SESSION_SECRET=${this.generateSessionSecret()}

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,https://anaghasafaar.com

# Logging Configuration
LOG_LEVEL=info
LOG_TO_FILE=true
LOG_FILE_PATH=./logs

# Monitoring Configuration
SENTRY_DSN=your_sentry_dsn
SENTRY_ENVIRONMENT=development
SENTRY_ENABLED=false

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# External API Configuration
AMADEUS_API_KEY=your_amadeus_api_key
AMADEUS_API_SECRET=your_amadeus_api_secret
RATEHAWK_API_KEY=your_ratehawk_api_key
TBO_API_KEY=your_tbo_api_key
TBO_API_SECRET=your_tbo_api_secret

# Feature Flags
FEATURE_DYNAMIC_PRICING=true
FEATURE_REAL_TIME_AVAILABILITY=true
FEATURE_ADVANCED_SEARCH=true
FEATURE_RECOMMENDATIONS=true
FEATURE_SOCIAL_LOGIN=false
FEATURE_WISHLIST=true
FEATURE_REVIEWS=true
FEATURE_CHAT_SUPPORT=false

# Security Features
SECURITY_ENABLE_CAPTCHA=true
SECURITY_ENABLE_FRAUD_DETECTION=true
SECURITY_ENABLE_RATE_LIMITING=true
SECURITY_ENABLE_AUDIT_LOGGING=true

# Compliance Configuration
GDPR_ENABLED=true
PCI_COMPLIANCE_ENABLED=true
DATA_RETENTION_DAYS=2555

# Performance Configuration
CACHE_TTL_DEFAULT=3600
CACHE_TTL_BOOKING=900
CACHE_TTL_PRICING=300

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
`;
  }

  public static validateEnvironmentFile(filePath: string): boolean {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          const value = valueParts.join('=');
          
          if (!key || !value) {
            console.error(`Invalid line format: ${line}`);
            return false;
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to validate environment file: ${error}`);
      return false;
    }
  }
}

// =============================================================================
// 6. EXPORT CONFIGURATION
// =============================================================================

export const env = EnvironmentManager.getInstance().getConfig();
export const secretsManager = SecretsManager.getInstance();

export default {
  EnvironmentManager,
  SecretsManager,
  ConfigurationValidator,
  ConfigurationUtils,
  env,
  secretsManager
};

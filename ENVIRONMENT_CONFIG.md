# Environment Configuration for Anagha Safaar
# Copy this file to .env.local and fill in your actual API keys

# =============================================================================
# API Configuration
# =============================================================================
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# =============================================================================
# Razorpay Payment Gateway Configuration
# =============================================================================
# Get these from Razorpay Dashboard: https://dashboard.razorpay.com/
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
VITE_RAZORPAY_KEY_SECRET=your_razorpay_key_secret
VITE_RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Razorpay Configuration
VITE_RAZORPAY_CURRENCY=INR
VITE_RAZORPAY_THEME_COLOR=#3B82F6

# =============================================================================
# SendGrid Email Service Configuration
# =============================================================================
# Get these from SendGrid Dashboard: https://app.sendgrid.com/
VITE_SENDGRID_API_KEY=SG.your_sendgrid_api_key
VITE_SENDGRID_FROM_EMAIL=noreply@anaghasafaar.com
VITE_SENDGRID_FROM_NAME=Anagha Safaar

# Email Templates
VITE_SENDGRID_BOOKING_CONFIRMATION_TEMPLATE=d-booking-confirmation-template-id
VITE_SENDGRID_BOOKING_CANCELLATION_TEMPLATE=d-booking-cancellation-template-id
VITE_SENDGRID_PAYMENT_RECEIPT_TEMPLATE=d-payment-receipt-template-id

# =============================================================================
# Twilio SMS Service Configuration
# =============================================================================
# Get these from Twilio Console: https://console.twilio.com/
VITE_TWILIO_ACCOUNT_SID=your_twilio_account_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_auth_token
VITE_TWILIO_PHONE_NUMBER=+1234567890

# SMS Configuration
VITE_TWILIO_SMS_FROM_NAME=Anagha Safaar
VITE_TWILIO_SMS_ENABLED=true

# =============================================================================
# Redis Configuration (for booking locks)
# =============================================================================
VITE_REDIS_HOST=localhost
VITE_REDIS_PORT=6379
VITE_REDIS_PASSWORD=your_redis_password
VITE_REDIS_DB=0

# Redis Configuration
VITE_REDIS_TTL_DEFAULT=900
VITE_REDIS_TTL_BOOKING_LOCK=900
VITE_REDIS_TTL_PAYMENT_ORDER=1800

# =============================================================================
# Security Configuration
# =============================================================================
# Encryption keys (generate secure random keys)
VITE_ENCRYPTION_KEY=your_32_character_encryption_key
VITE_JWT_SECRET=your_jwt_secret_key
VITE_SESSION_SECRET=your_session_secret_key

# Security Settings
VITE_SESSION_TIMEOUT=3600
VITE_MAX_LOGIN_ATTEMPTS=5
VITE_LOCKOUT_DURATION=900
VITE_PASSWORD_MIN_LENGTH=8
VITE_PASSWORD_REQUIRE_UPPERCASE=true
VITE_PASSWORD_REQUIRE_LOWERCASE=true
VITE_PASSWORD_REQUIRE_NUMBERS=true
VITE_PASSWORD_REQUIRE_SYMBOLS=true

# =============================================================================
# CAPTCHA Configuration
# =============================================================================
# Get these from Google reCAPTCHA: https://www.google.com/recaptcha/
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
VITE_RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
VITE_RECAPTCHA_ENABLED=true

# =============================================================================
# Monitoring and Analytics
# =============================================================================
# Sentry Error Tracking
VITE_SENTRY_DSN=your_sentry_dsn
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_ENABLED=true

# Mixpanel Analytics
VITE_MIXPANEL_TOKEN=your_mixpanel_token
VITE_MIXPANEL_ENABLED=true

# =============================================================================
# Booking Configuration
# =============================================================================
# Booking Settings
VITE_BOOKING_LOCK_DURATION=15
VITE_BOOKING_EXTEND_DURATION=5
VITE_BOOKING_MAX_EXTENSIONS=2
VITE_BOOKING_CONFIRMATION_TIMEOUT=1800

# Payment Settings
VITE_PAYMENT_TIMEOUT=900
VITE_PAYMENT_RETRY_ATTEMPTS=3
VITE_PAYMENT_RETRY_DELAY=5000
VITE_REFUND_PROCESSING_TIME=24

# =============================================================================
# Notification Configuration
# =============================================================================
# Email Settings
VITE_EMAIL_ENABLED=true
VITE_EMAIL_RETRY_ATTEMPTS=3
VITE_EMAIL_RETRY_DELAY=5000
VITE_EMAIL_BATCH_SIZE=100

# SMS Settings
VITE_SMS_ENABLED=true
VITE_SMS_RETRY_ATTEMPTS=3
VITE_SMS_RETRY_DELAY=5000
VITE_SMS_BATCH_SIZE=50

# Push Notification Settings
VITE_PUSH_ENABLED=false
VITE_PUSH_VAPID_PUBLIC_KEY=your_vapid_public_key
VITE_PUSH_VAPID_PRIVATE_KEY=your_vapid_private_key

# =============================================================================
# External API Configuration
# =============================================================================
# Amadeus Flight API
VITE_AMADEUS_API_KEY=your_amadeus_api_key
VITE_AMADEUS_API_SECRET=your_amadeus_api_secret
VITE_AMADEUS_BASE_URL=https://api.amadeus.com

# RateHawk Hotel API
VITE_RATEHAWK_API_KEY=your_ratehawk_api_key
VITE_RATEHAWK_BASE_URL=https://api.ratehawk.com

# TBO Tours API
VITE_TBO_API_KEY=your_tbo_api_key
VITE_TBO_API_SECRET=your_tbo_api_secret
VITE_TBO_BASE_URL=https://api.tbo.com

# =============================================================================
# Development Configuration
# =============================================================================
# Development Settings
VITE_DEV_MODE=false
VITE_DEBUG_ENABLED=false
VITE_MOCK_PAYMENTS=false
VITE_MOCK_NOTIFICATIONS=false
VITE_SKIP_CAPTCHA=false

# Logging
VITE_LOG_LEVEL=info
VITE_LOG_TO_CONSOLE=true
VITE_LOG_TO_FILE=false
VITE_LOG_FILE_PATH=./logs/app.log

# =============================================================================
# Production Configuration
# =============================================================================
# Production Settings
VITE_PRODUCTION_MODE=true
VITE_HTTPS_ENABLED=true
VITE_CORS_ORIGINS=https://anaghasafaar.com,https://www.anaghasafaar.com
VITE_RATE_LIMIT_ENABLED=true
VITE_RATE_LIMIT_WINDOW=900000
VITE_RATE_LIMIT_MAX_REQUESTS=100

# Database
VITE_DB_POOL_SIZE=20
VITE_DB_CONNECTION_TIMEOUT=30000
VITE_DB_QUERY_TIMEOUT=10000

# Cache
VITE_CACHE_ENABLED=true
VITE_CACHE_TTL_DEFAULT=3600
VITE_CACHE_TTL_BOOKING=900
VITE_CACHE_TTL_PRICING=300

# =============================================================================
# Feature Flags
# =============================================================================
# Feature Toggles
VITE_FEATURE_DYNAMIC_PRICING=true
VITE_FEATURE_REAL_TIME_AVAILABILITY=true
VITE_FEATURE_ADVANCED_SEARCH=true
VITE_FEATURE_RECOMMENDATIONS=true
VITE_FEATURE_SOCIAL_LOGIN=true
VITE_FEATURE_WISHLIST=true
VITE_FEATURE_REVIEWS=true
VITE_FEATURE_CHAT_SUPPORT=true

# =============================================================================
# Third-party Integrations
# =============================================================================
# Google Services
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_GOOGLE_ANALYTICS_ID=your_google_analytics_id
VITE_GOOGLE_TAG_MANAGER_ID=your_gtm_id

# Facebook
VITE_FACEBOOK_APP_ID=your_facebook_app_id
VITE_FACEBOOK_APP_SECRET=your_facebook_app_secret

# WhatsApp Business API
VITE_WHATSAPP_API_URL=https://graph.facebook.com/v18.0
VITE_WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
VITE_WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id

# =============================================================================
# Backup and Recovery
# =============================================================================
# Backup Settings
VITE_BACKUP_ENABLED=true
VITE_BACKUP_SCHEDULE=0 2 * * *
VITE_BACKUP_RETENTION_DAYS=30
VITE_BACKUP_S3_BUCKET=anagha-safaar-backups
VITE_BACKUP_S3_REGION=us-east-1

# =============================================================================
# Compliance and Legal
# =============================================================================
# GDPR Settings
VITE_GDPR_ENABLED=true
VITE_GDPR_CONSENT_REQUIRED=true
VITE_GDPR_DATA_RETENTION_DAYS=2555
VITE_GDPR_COOKIE_CONSENT=true

# PCI DSS Settings
VITE_PCI_COMPLIANCE_ENABLED=true
VITE_PCI_TOKENIZATION_ENABLED=true
VITE_PCI_ENCRYPTION_ENABLED=true

# =============================================================================
# Performance Optimization
# =============================================================================
# CDN Settings
VITE_CDN_ENABLED=true
VITE_CDN_URL=https://cdn.anaghasafaar.com
VITE_CDN_CACHE_TTL=86400

# Image Optimization
VITE_IMAGE_OPTIMIZATION_ENABLED=true
VITE_IMAGE_QUALITY=80
VITE_IMAGE_FORMAT=webp
VITE_IMAGE_MAX_WIDTH=1920
VITE_IMAGE_MAX_HEIGHT=1080

# Bundle Optimization
VITE_BUNDLE_ANALYZER_ENABLED=false
VITE_TREE_SHAKING_ENABLED=true
VITE_CODE_SPLITTING_ENABLED=true
VITE_LAZY_LOADING_ENABLED=true

# =============================================================================
# Testing Configuration
# =============================================================================
# Test Settings
VITE_TEST_MODE=false
VITE_TEST_DATABASE_URL=postgresql://test:test@localhost:5432/anagha_safaar_test
VITE_TEST_REDIS_URL=redis://localhost:6379/1
VITE_TEST_EMAIL=test@anaghasafaar.com
VITE_TEST_PHONE=+1234567890

# Test API Keys (use test keys for testing)
VITE_TEST_RAZORPAY_KEY_ID=rzp_test_test_key_id
VITE_TEST_RAZORPAY_KEY_SECRET=test_razorpay_key_secret
VITE_TEST_SENDGRID_API_KEY=SG.test_sendgrid_api_key
VITE_TEST_TWILIO_ACCOUNT_SID=test_twilio_account_sid
VITE_TEST_TWILIO_AUTH_TOKEN=test_twilio_auth_token

# =============================================================================
# Documentation
# =============================================================================
# This file contains all environment variables needed for the Anagha Safaar
# travel booking platform. Make sure to:
# 1. Copy this file to .env.local
# 2. Replace all placeholder values with actual API keys
# 3. Never commit .env.local to version control
# 4. Use different values for development, staging, and production
# 5. Regularly rotate sensitive keys like API secrets and encryption keys
# 6. Monitor API usage and set up alerts for unusual activity
# 7. Keep backup copies of important configuration values
# 8. Document any custom configurations for your team

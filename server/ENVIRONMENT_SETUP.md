# Environment Configuration for Anagha Safaar Server

## Required Environment Variables

### Database Configuration
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Authentication Configuration
```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Server Configuration
```bash
# Server Settings
NODE_ENV=development
PORT=3001
LOG_LEVEL=info
LOG_DIR=logs
```

### CORS Configuration
```bash
# CORS Settings
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Rate Limiting Configuration
```bash
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Redis Configuration
```bash
# Redis Settings
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
```

### Payment Gateway Configuration
```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret
```

### External API Configuration
```bash
# Amadeus API Configuration
AMADEUS_API_KEY=your-amadeus-api-key
AMADEUS_API_SECRET=your-amadeus-api-secret
AMADEUS_BASE_URL=https://test.api.amadeus.com
```

### Email/SMS Configuration
```bash
# SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@anaghasafaar.com

# Twilio Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Frontend Configuration
```bash
# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Security Configuration
```bash
# API Security
API_KEY=your-secure-api-key-for-external-access
```

## Environment Setup Instructions

### 1. Development Environment
1. Copy this file to `.env` in the server directory
2. Fill in all the required values
3. Ensure Redis is running locally
4. Set up Supabase project and get the keys
5. Configure Razorpay test account
6. Set up Amadeus test account

### 2. Production Environment
1. Use environment-specific values
2. Set `NODE_ENV=production`
3. Use production Redis instance
4. Use production Supabase project
5. Use Razorpay live account
6. Use Amadeus production account
7. Set up proper logging and monitoring

### 3. Docker Environment
1. Use Docker secrets for sensitive values
2. Set up proper networking
3. Configure volume mounts for logs
4. Set up health checks

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique secrets for JWT keys
- Rotate API keys regularly
- Use environment-specific configurations
- Enable SSL/TLS in production
- Set up proper firewall rules
- Monitor access logs

## Validation

The server validates all environment variables on startup using Zod schemas. Missing or invalid variables will cause the server to fail to start with descriptive error messages.

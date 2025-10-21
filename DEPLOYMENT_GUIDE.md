# 🚀 Anagha Safaar - AI-Powered Travel Booking Platform

## 📋 Deployment Guide

### Prerequisites
- Node.js 18+ installed
- Vercel account (free tier available)
- Supabase account
- API keys for external services

### 🚀 Quick Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy to Production**
   ```bash
   vercel --prod --yes
   ```

4. **Set Environment Variables in Vercel Dashboard**
   Go to your project settings in Vercel and add these environment variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   VITE_AMADEUS_API_KEY=your_amadeus_api_key
   VITE_AMADEUS_API_SECRET=your_amadeus_api_secret
   VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
   VITE_RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   VITE_OPENAI_API_KEY=your_openai_api_key
   VITE_SENTRY_DSN=your_sentry_dsn
   VITE_MIXPANEL_TOKEN=your_mixpanel_token
   VITE_GOOGLE_ANALYTICS_ID=your_ga4_id
   VITE_SENDGRID_API_KEY=your_sendgrid_api_key
   VITE_TWILIO_ACCOUNT_SID=your_twilio_account_sid
   VITE_TWILIO_AUTH_TOKEN=your_twilio_auth_token
   VITE_TWILIO_PHONE_NUMBER=your_twilio_phone_number
   ```

### 🔧 Local Development Setup

1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd anagha-safaar
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your API keys
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Run Tests**
   ```bash
   npm run test:run
   ```

### 📊 Production Features

✅ **Real-time Travel APIs**
- Amadeus Hotels & Flights API
- RateHawk Hotels API (fallback)
- TBO Tours API

✅ **Payment Processing**
- Razorpay UPI Integration
- Secure payment verification
- Automated refunds

✅ **AI-Powered Features**
- OpenAI GPT-4 Itinerary Generation
- Anthropic Claude Integration
- Personalized trip planning

✅ **Monitoring & Analytics**
- Sentry Error Tracking
- Mixpanel User Analytics
- Google Analytics 4

✅ **Production Ready**
- Error Boundaries
- Performance Monitoring
- Security Headers
- Mobile Responsive

### 🛠️ Build Commands

```bash
# Development
npm run dev

# Production Build
npm run build

# Preview Production Build
npm run preview

# Run Tests
npm run test:run

# Test Coverage
npm run test:coverage
```

### 📱 Mobile App Deployment

For mobile deployment, consider:
- React Native conversion
- PWA (Progressive Web App) features
- Capacitor for native apps

### 🔒 Security Checklist

- [ ] Environment variables secured
- [ ] API rate limiting implemented
- [ ] Input validation on all forms
- [ ] HTTPS enforced
- [ ] CORS configured properly
- [ ] Supabase RLS policies reviewed

### 📈 Performance Optimization

- [ ] Image optimization
- [ ] Code splitting implemented
- [ ] Caching strategies
- [ ] CDN configuration
- [ ] Bundle size optimization

### 🧪 Testing Strategy

- Unit tests for components
- Integration tests for API calls
- E2E tests for critical user flows
- Performance testing
- Security testing

### 📞 Support & Maintenance

- Monitor error rates via Sentry
- Track user behavior via Mixpanel
- Regular dependency updates
- Performance monitoring
- Security audits

---

**Ready to deploy? Follow the steps above and your AI-powered travel platform will be live in minutes!** 🚀✈️

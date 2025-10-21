# 🌟 Anagha Safaar - AI-Powered Travel Booking Platform

> **Transform your travel dreams into reality with AI-powered personalized itineraries and seamless booking experiences.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/anagha-safaar)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

## 🎯 Overview

**Anagha Safaar** is a production-grade, AI-powered travel booking platform that revolutionizes how travelers plan and book their journeys. Built with modern web technologies and integrated with cutting-edge AI services, it provides personalized travel experiences at scale.

### ✨ Key Features

🤖 **AI-Powered Trip Planning**
- OpenAI GPT-4 & Anthropic Claude integration
- Personalized itinerary generation
- Budget-aware recommendations
- Interest-based suggestions

🌍 **Real-Time Travel APIs**
- Amadeus Hotels & Flights API
- RateHawk Hotels API (fallback)
- TBO Tours API
- Live pricing and availability

💳 **Secure Payment Processing**
- Razorpay UPI integration
- Multi-payment method support
- Automated refunds
- Payment verification

📊 **Advanced Analytics & Monitoring**
- Sentry error tracking
- Mixpanel user analytics
- Google Analytics 4
- Performance monitoring

🛡️ **Production-Ready Security**
- Global error boundaries
- Input validation
- Rate limiting
- Secure API handling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- API keys for external services

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/anagha-safaar.git
cd anagha-safaar

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the application.

## 🏗️ Architecture

### Frontend Stack
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Beautiful component library
- **React Query** - Data fetching and caching
- **React Router** - Client-side routing

### Backend & APIs
- **Supabase** - Database and authentication
- **Amadeus API** - Hotels and flights data
- **Razorpay** - Payment processing
- **OpenAI API** - AI itinerary generation
- **SendGrid** - Email notifications
- **Twilio** - SMS notifications

### Monitoring & Analytics
- **Sentry** - Error tracking
- **Mixpanel** - User analytics
- **Google Analytics 4** - Web analytics

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/ui components
│   ├── BookingForm.tsx # Booking form component
│   ├── PaymentModal.tsx # Payment processing modal
│   └── ItineraryGenerator.tsx # AI itinerary component
├── pages/              # Route components
│   ├── Hotels.tsx     # Hotels listing page
│   ├── Flights.tsx    # Flights listing page
│   ├── Tours.tsx      # Tours listing page
│   └── Dashboard.tsx  # User dashboard
├── lib/                # Utility libraries
│   ├── api/           # API service files
│   │   ├── travel.ts  # Travel APIs
│   │   ├── payment.ts # Payment APIs
│   │   ├── booking.ts # Booking APIs
│   │   ├── ai.ts      # AI services
│   │   └── notifications.ts # Notification APIs
│   ├── logger.ts      # Logging utility
│   └── monitoring.ts  # Monitoring service
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/      # Supabase client and types
└── test/              # Test files
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Travel APIs
VITE_AMADEUS_API_KEY=your_amadeus_api_key
VITE_AMADEUS_API_SECRET=your_amadeus_api_secret

# Payment Gateway
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# AI Services
VITE_OPENAI_API_KEY=your_openai_api_key

# Monitoring
VITE_SENTRY_DSN=your_sentry_dsn
VITE_MIXPANEL_TOKEN=your_mixpanel_token
VITE_GOOGLE_ANALYTICS_ID=your_ga4_id

# Notifications
VITE_SENDGRID_API_KEY=your_sendgrid_api_key
VITE_TWILIO_ACCOUNT_SID=your_twilio_account_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_auth_token
VITE_TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

## 🧪 Testing

```bash
# Run all tests
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui
```

## 📦 Build & Deployment

### Production Build
```bash
npm run build
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod --yes
```

### Deploy to Other Platforms
- **Netlify**: Connect your GitHub repository
- **Railway**: Use the Railway CLI
- **AWS Amplify**: Connect your repository
- **Docker**: Use the included Dockerfile

## 🔌 API Integration

### Travel APIs
- **Amadeus**: Hotels and flights data
- **RateHawk**: Hotel booking fallback
- **TBO**: Tour packages

### Payment APIs
- **Razorpay**: UPI, cards, net banking
- **Webhook handling**: Payment verification

### AI APIs
- **OpenAI**: GPT-4 for itinerary generation
- **Anthropic**: Claude integration

## 📊 Monitoring & Analytics

### Error Tracking
- Sentry integration for production errors
- Custom error boundaries
- Performance monitoring

### User Analytics
- Mixpanel for user behavior tracking
- Google Analytics 4 for web analytics
- Custom event tracking

## 🛡️ Security Features

- Input validation on all forms
- Rate limiting for API calls
- Secure environment variable handling
- HTTPS enforcement
- CORS configuration
- Supabase RLS policies

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Theme switching capability
- **Accessibility**: WCAG compliant components
- **Animations**: Framer Motion integration
- **Loading States**: Skeleton loaders
- **Error Handling**: User-friendly error messages

## 📱 Mobile Support

- Progressive Web App (PWA) ready
- Mobile-responsive design
- Touch-friendly interfaces
- Offline capability (with service workers)

## 🔄 CI/CD Pipeline

The project includes:
- Automated testing on pull requests
- Build verification
- Deployment automation
- Environment variable management

## 📈 Performance Optimization

- **Code Splitting**: Dynamic imports
- **Lazy Loading**: Component-level lazy loading
- **Caching**: React Query caching
- **Image Optimization**: Next-gen formats
- **Bundle Analysis**: Webpack bundle analyzer

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) for backend services
- [Amadeus](https://developers.amadeus.com/) for travel APIs
- [Razorpay](https://razorpay.com/) for payment processing
- [OpenAI](https://openai.com/) for AI services
- [Shadcn/ui](https://ui.shadcn.com/) for beautiful components

## 📞 Support

- 📧 Email: support@anaghasafar.com
- 💬 Discord: [Join our community](https://discord.gg/anaghasafar)
- 📖 Documentation: [docs.anaghasafar.com](https://docs.anaghasafar.com)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/anagha-safaar/issues)

---

**Built with ❤️ for travelers worldwide. Start your journey with Anagha Safaar today!** ✈️🌍
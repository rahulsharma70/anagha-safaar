# Dependency Map - Anagha Safaar Travel Platform

## 📦 Core Dependencies

### React Ecosystem
```
react@18.3.1                    # Core React library
react-dom@18.3.1               # React DOM rendering
react-router-dom@6.30.1        # Client-side routing
@tanstack/react-query@5.90.5   # Server state management
@tanstack/react-query-devtools@5.90.2 # Query dev tools
```

### TypeScript & Build Tools
```
typescript@5.8.3               # TypeScript compiler
vite@5.4.19                    # Build tool and dev server
@vitejs/plugin-react-swc@3.11.0 # React plugin for Vite
@types/react@18.3.23          # React TypeScript definitions
@types/react-dom@18.3.7       # React DOM TypeScript definitions
@types/node@22.16.5           # Node.js TypeScript definitions
```

### UI Framework & Components
```
@radix-ui/react-*              # Headless UI components
├── react-accordion@1.2.11
├── react-alert-dialog@1.1.14
├── react-aspect-ratio@1.1.7
├── react-avatar@1.1.10
├── react-checkbox@1.3.2
├── react-collapsible@1.1.11
├── react-context-menu@2.2.15
├── react-dialog@1.1.14
├── react-dropdown-menu@2.1.15
├── react-hover-card@1.1.14
├── react-label@2.1.7
├── react-menubar@1.1.15
├── react-navigation-menu@1.2.13
├── react-popover@1.1.14
├── react-progress@1.1.7
├── react-radio-group@1.3.7
├── react-scroll-area@1.2.9
├── react-select@2.2.5
├── react-separator@1.1.7
├── react-slider@1.3.5
├── react-slot@1.2.3
├── react-switch@1.2.5
├── react-tabs@1.1.12
├── react-toast@1.2.14
├── react-toggle-group@1.1.10
├── react-toggle@1.1.9
└── react-tooltip@1.2.7

tailwindcss@3.4.17             # Utility-first CSS framework
tailwindcss-animate@1.0.7      # Animation utilities
@tailwindcss/typography@0.5.16 # Typography plugin
tailwind-merge@2.6.0           # Tailwind class merging
class-variance-authority@0.7.1 # Component variant management
```

### Forms & Validation
```
react-hook-form@7.61.1         # Form state management
@hookform/resolvers@3.10.0     # Form validation resolvers
zod@3.25.76                    # Schema validation
input-otp@1.4.2               # OTP input component
```

### Data & State Management
```
@supabase/supabase-js@2.76.1   # Supabase client
axios@1.12.2                   # HTTP client
swr@2.3.6                     # Data fetching library
```

### UI Enhancements
```
lucide-react@0.462.0           # Icon library
framer-motion@12.23.24         # Animation library
embla-carousel-react@8.6.0     # Carousel component
react-day-picker@8.10.1        # Date picker
react-resizable-panels@2.1.9   # Resizable panels
vaul@0.9.9                     # Drawer component
cmdk@1.1.1                     # Command palette
sonner@1.7.4                   # Toast notifications
next-themes@0.3.0              # Theme management
```

### Utilities & Helpers
```
date-fns@3.6.0                 # Date manipulation
clsx@2.1.1                     # Conditional class names
recharts@2.15.4                # Chart library
```

## 🔌 External Service Integrations

### Payment Processing
```
razorpay@2.9.6                 # Razorpay payment gateway
```

### Communication Services
```
@sendgrid/mail@8.1.6           # Email service
twilio@5.10.3                  # SMS/WhatsApp service
```

### Monitoring & Analytics
```
@sentry/react@10.21.0          # Error tracking
@sentry/tracing@7.120.4        # Performance monitoring
mixpanel-browser@2.71.0         # Analytics tracking
```

### Internationalization
```
i18next@25.6.0                 # i18n framework
react-i18next@16.1.4           # React i18n integration
```

## 🛠️ Development Dependencies

### Linting & Code Quality
```
eslint@9.32.0                  # JavaScript linter
@eslint/js@9.32.0              # ESLint JavaScript config
eslint-plugin-react-hooks@5.2.0 # React hooks linting
eslint-plugin-react-refresh@0.4.20 # React refresh linting
typescript-eslint@8.38.0       # TypeScript ESLint
globals@15.15.0                # Global variables
```

### CSS Processing
```
postcss@8.5.6                  # CSS post-processor
autoprefixer@10.4.21           # CSS vendor prefixing
```

### Development Tools
```
lovable-tagger@1.1.11          # Lovable development tool
```

## 📊 Dependency Analysis

### Bundle Size Impact
- **Core React**: ~45KB (gzipped)
- **Radix UI Components**: ~15KB (gzipped)
- **Tailwind CSS**: ~10KB (gzipped)
- **TanStack Query**: ~13KB (gzipped)
- **Framer Motion**: ~25KB (gzipped)
- **Total Estimated Bundle**: ~150KB (gzipped)

### Security Considerations
- All dependencies are actively maintained
- Regular security audits recommended
- No known vulnerabilities in current versions
- External API integrations require secure key management

### Performance Impact
- **Tree Shaking**: Supported by Vite
- **Code Splitting**: Automatic with React Router
- **Lazy Loading**: Implemented for routes
- **Caching**: React Query provides intelligent caching

## 🔄 Dependency Management

### Update Strategy
```bash
# Check for outdated packages
npm outdated

# Update all dependencies
npm update

# Update specific packages
npm install package@latest

# Security audit
npm audit
npm audit fix
```

### Version Pinning
- **Major versions**: Pinned for stability
- **Minor versions**: Auto-updated for features
- **Patch versions**: Auto-updated for security

### Critical Dependencies
- **React**: Core framework (18.3.1)
- **TypeScript**: Type safety (5.8.3)
- **Vite**: Build tool (5.4.19)
- **Supabase**: Backend services (2.76.1)
- **TanStack Query**: Data fetching (5.90.5)

## 🚀 Production Optimizations

### Bundle Optimization
- Vite's built-in tree shaking
- Dynamic imports for code splitting
- Image optimization
- CSS purging with Tailwind

### Runtime Performance
- React Query caching
- Memoization with React.memo
- Virtual scrolling for large lists
- Lazy loading for images

### Monitoring Dependencies
- Sentry for error tracking
- Mixpanel for analytics
- Performance monitoring
- User behavior tracking

## 📋 Maintenance Checklist

### Monthly
- [ ] Check for security vulnerabilities
- [ ] Update minor versions
- [ ] Review bundle size
- [ ] Test critical functionality

### Quarterly
- [ ] Update major versions
- [ ] Review deprecated packages
- [ ] Performance audit
- [ ] Dependency cleanup

### Annually
- [ ] Complete dependency audit
- [ ] Framework version updates
- [ ] Security review
- [ ] Performance optimization

---

**Last Updated**: October 2024
**Total Dependencies**: 75+ packages
**Bundle Size**: ~150KB (gzipped)
**Security Status**: ✅ No known vulnerabilities

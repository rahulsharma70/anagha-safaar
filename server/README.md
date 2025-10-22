# Anagha Safaar Server

Backend API server for the Anagha Safaar travel booking platform built with Express.js, TypeScript, and Supabase.

## Features

### 🏨 Hotels
- CRUD operations for hotel management
- Advanced search and filtering (location, price, amenities, rating)
- Pagination support
- Featured hotels listing
- Location-based search

### 🎯 Tours
- Complete tour management with itinerary support
- Tour type filtering (spiritual, adventure, cultural, luxury)
- Difficulty level filtering
- Duration-based search
- Detailed itinerary management

### ✈️ Flights
- Live flight data integration with Amadeus API
- Real-time flight search and pricing
- Airport code lookup
- Flight offer management
- Price analysis and tracking
- Redis caching for improved performance

### 📅 Bookings
- Complete booking lifecycle management
- Guest information handling
- Booking status tracking
- Cancellation with policy enforcement
- Booking details with item information

### 💳 Payments
- Razorpay payment gateway integration
- Secure payment processing
- Webhook handling for payment events
- Refund management
- Payment status tracking

### 👤 User Management
- JWT-based authentication
- User profile management
- Password change functionality
- Account deletion
- User statistics and activity tracking

### 🔐 Security
- Comprehensive input validation with Zod
- Rate limiting per IP and user
- JWT token authentication
- Role-based authorization
- Security headers with Helmet
- CORS configuration
- Request logging and monitoring

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Cache**: Redis
- **Authentication**: JWT
- **Payment**: Razorpay
- **External APIs**: Amadeus (Flights)
- **Logging**: Winston
- **Validation**: Zod
- **Security**: Helmet, bcrypt

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm 8+
- Redis server
- Supabase project
- Razorpay account
- Amadeus API access

### Installation

1. **Clone and navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp ENVIRONMENT_SETUP.md .env
   # Edit .env with your actual values
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset
- `POST /api/auth/verify-email` - Email verification
- `GET /api/auth/me` - Get current user

### Hotels
- `GET /api/hotels` - List hotels with filters
- `GET /api/hotels/:id` - Get hotel by ID
- `GET /api/hotels/slug/:slug` - Get hotel by slug
- `POST /api/hotels` - Create hotel (Admin)
- `PUT /api/hotels/:id` - Update hotel (Admin)
- `DELETE /api/hotels/:id` - Delete hotel (Admin)
- `GET /api/hotels/featured/list` - Featured hotels
- `GET /api/hotels/search/location` - Search by location

### Tours
- `GET /api/tours` - List tours with filters
- `GET /api/tours/:id` - Get tour by ID
- `GET /api/tours/slug/:slug` - Get tour by slug
- `POST /api/tours` - Create tour (Admin)
- `PUT /api/tours/:id` - Update tour (Admin)
- `DELETE /api/tours/:id` - Delete tour (Admin)
- `GET /api/tours/featured/list` - Featured tours
- `GET /api/tours/search/location` - Search by location
- `GET /api/tours/type/:tourType` - Tours by type
- `GET /api/tours/:id/itinerary` - Tour itinerary

### Flights
- `GET /api/flights/search` - Search flights (Amadeus API)
- `GET /api/flights/offers/:offerId` - Get flight offer
- `GET /api/flights/airports` - Search airports
- `GET /api/flights` - List flights from database
- `GET /api/flights/:id` - Get flight by ID
- `POST /api/flights` - Create flight (Admin)
- `PUT /api/flights/:id` - Update flight (Admin)
- `DELETE /api/flights/:id` - Delete flight (Admin)
- `GET /api/flights/featured/list` - Featured flights
- `GET /api/flights/:id/price-history` - Price history

### Bookings
- `GET /api/bookings` - User bookings
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `POST /api/bookings/:id/cancel` - Cancel booking
- `GET /api/bookings/:id/details` - Booking with item details

### Payments
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/:paymentId/status` - Payment status
- `POST /api/payments/refund` - Create refund
- `GET /api/payments` - User payments
- `POST /api/payments/webhook` - Razorpay webhook

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/change-password` - Change password
- `DELETE /api/users/account` - Delete account
- `GET /api/users/stats` - User statistics
- `GET /api/users/activity` - User activity log
- `PUT /api/users/preferences` - Update preferences

## Environment Variables

See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for complete environment configuration.

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

### Project Structure

```
server/
├── src/
│   ├── app.ts              # Main application entry point
│   ├── lib/
│   │   └── logger.ts       # Winston logger configuration
│   ├── middleware/
│   │   ├── index.ts        # General middleware
│   │   ├── auth.ts         # Authentication middleware
│   │   ├── errorHandler.ts # Error handling
│   │   └── validation.ts   # Request validation
│   ├── routes/
│   │   ├── auth.ts         # Authentication routes
│   │   ├── hotels.ts       # Hotel routes
│   │   ├── tours.ts        # Tour routes
│   │   ├── flights.ts      # Flight routes
│   │   ├── bookings.ts     # Booking routes
│   │   ├── payments.ts     # Payment routes
│   │   └── users.ts        # User routes
│   └── services/
│       ├── amadeusService.ts # Amadeus API integration
│       └── redisService.ts   # Redis caching service
├── package.json
├── tsconfig.json
└── ENVIRONMENT_SETUP.md
```

## Security Features

- **Input Validation**: All inputs validated with Zod schemas
- **Rate Limiting**: Per-IP and per-user rate limiting
- **Authentication**: JWT-based authentication with refresh tokens
- **Authorization**: Role-based access control
- **Security Headers**: Helmet.js for security headers
- **CORS**: Configurable CORS policies
- **Logging**: Comprehensive request/response logging
- **Error Handling**: Secure error responses without sensitive data

## Performance Features

- **Redis Caching**: API response caching for improved performance
- **Pagination**: Efficient pagination for large datasets
- **Database Indexing**: Optimized database queries
- **Connection Pooling**: Efficient database connections
- **Request Logging**: Performance monitoring

## Monitoring & Logging

- **Winston Logger**: Structured logging with multiple transports
- **Request Tracking**: Correlation IDs for request tracing
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Response time tracking
- **Security Events**: Authentication and authorization logging

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Deployment

### Docker

```bash
# Build Docker image
npm run docker:build

# Run Docker container
npm run docker:run
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set up Redis instance
- [ ] Configure payment gateway
- [ ] Set up monitoring and logging
- [ ] Configure SSL/TLS
- [ ] Set up backup strategy
- [ ] Configure rate limiting
- [ ] Set up health checks

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

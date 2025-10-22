# Comprehensive Testing Guide

## Overview

This document provides a complete guide to testing the travel booking application, covering both backend API tests (Jest) and frontend end-to-end tests (Cypress).

## Test Structure

```
├── server/
│   ├── tests/
│   │   ├── api.test.js          # Comprehensive API tests
│   │   └── setup.js             # Jest test setup
│   ├── jest.config.js           # Jest configuration
│   └── package.json             # Server dependencies
├── cypress/
│   ├── e2e/
│   │   └── travel-booking.cy.js # E2E test suite
│   ├── fixtures/
│   │   └── api-responses.js     # Test data fixtures
│   ├── support/
│   │   └── e2e.js               # Cypress support file
│   └── cypress.config.js       # Cypress configuration
├── run-tests.js                 # Test runner script
└── package.json                 # Root package.json with test scripts
```

## Test Coverage

### Backend API Tests (Jest)

**Test Suites:**
- **Hotels API** - CRUD operations, search, filtering, pagination
- **Flights API** - Search, Amadeus integration, caching
- **Bookings API** - Creation, inventory locking, status updates
- **Payments API** - Razorpay integration, webhooks, refunds
- **Notifications API** - SendGrid, Twilio, bulk processing
- **AI Itineraries API** - OpenAI/Claude integration, generation
- **Integration Tests** - End-to-end booking flows

**Key Features Tested:**
- ✅ Authentication & Authorization
- ✅ Input Validation & Sanitization
- ✅ Error Handling & Edge Cases
- ✅ Database Operations
- ✅ External API Integrations
- ✅ Redis Caching
- ✅ File Uploads
- ✅ Rate Limiting
- ✅ Security Middleware

### Frontend E2E Tests (Cypress)

**Test Flows:**
- **Authentication** - Login, registration, error handling
- **Hotel Booking** - Search, selection, booking, payment
- **Flight Booking** - Search, selection, booking, payment
- **Tour Booking** - Search, selection, booking, payment
- **AI Itinerary** - Generation, saving, conversion to booking
- **Payment Processing** - Razorpay integration, success/failure
- **Notifications** - Email, SMS, WhatsApp notifications
- **User Dashboard** - Bookings, itineraries, cancellations
- **Responsive Design** - Mobile, tablet, desktop
- **Accessibility** - Keyboard navigation, ARIA labels

**Key Features Tested:**
- ✅ User Interface Interactions
- ✅ Form Submissions
- ✅ Navigation & Routing
- ✅ Responsive Design
- ✅ Accessibility Compliance
- ✅ Error Handling
- ✅ Loading States
- ✅ Success/Failure Scenarios

## Running Tests

### Prerequisites

1. **Install Dependencies:**
   ```bash
   # Root dependencies
   npm install
   
   # Server dependencies
   cd server && npm install
   ```

2. **Environment Setup:**
   ```bash
   # Copy environment files
   cp .env.example .env
   cp server/.env.example server/.env
   ```

3. **Database Setup:**
   ```bash
   # Start Supabase locally or configure remote instance
   supabase start
   ```

### Test Commands

#### Individual Test Suites

```bash
# Run Jest API tests
npm run test:jest

# Run Jest tests in watch mode
npm run test:jest:watch

# Run Jest tests with coverage
npm run test:jest:coverage

# Run Cypress E2E tests
npm run test:cypress

# Run Cypress tests in headed mode
npm run test:cypress:open

# Run Cypress tests headless
npm run test:cypress:headless
```

#### Comprehensive Test Suite

```bash
# Run all tests (Jest + Cypress + Coverage)
npm run test:all
```

## Test Configuration

### Jest Configuration

**File:** `server/jest.config.js`

```javascript
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
```

### Cypress Configuration

**File:** `cypress.config.js`

```javascript
module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000
  }
});
```

## Test Data & Fixtures

### API Test Fixtures

**File:** `cypress/fixtures/api-responses.js`

Contains mock data for:
- Hotels with amenities, pricing, availability
- Flights with airlines, pricing, schedules
- Bookings with status, references, amounts
- Payment orders with Razorpay integration
- AI itineraries with day-by-day breakdowns

### Test Utilities

**Custom Commands:**
- `cy.login(email, password)` - User authentication
- `cy.logout()` - User logout
- `cy.mockApi(method, url, response)` - API mocking
- `cy.waitForApi(alias)` - Wait for API calls
- `cy.clearStorage()` - Clear browser storage

## Test Scenarios

### Backend API Test Scenarios

#### Hotels API
```javascript
describe('Hotels API', () => {
  it('should get hotels list with pagination');
  it('should filter hotels by city');
  it('should filter hotels by price range');
  it('should return featured hotels');
  it('should get hotel by ID');
  it('should return 404 for non-existent hotel');
  it('should create hotel (admin only)');
  it('should return 409 for duplicate slug');
});
```

#### Bookings API
```javascript
describe('Bookings API', () => {
  it('should create booking successfully');
  it('should return 400 for insufficient inventory');
  it('should handle Redis inventory locking');
  it('should get user bookings with pagination');
  it('should filter bookings by status');
  it('should update booking status');
});
```

#### Payments API
```javascript
describe('Payments API', () => {
  it('should create Razorpay order successfully');
  it('should return 400 for invalid amount');
  it('should handle payment captured webhook');
  it('should handle payment failed webhook');
  it('should return 401 for invalid signature');
  it('should process refund successfully');
});
```

### Frontend E2E Test Scenarios

#### Hotel Booking Flow
```javascript
describe('Hotel Booking Flow', () => {
  it('should complete hotel search and booking');
  it('should filter hotels by price range');
  it('should filter hotels by amenities');
});
```

#### AI Itinerary Flow
```javascript
describe('AI Itinerary Generation', () => {
  it('should generate AI itinerary');
  it('should save itinerary');
  it('should convert itinerary to booking');
});
```

## Mocking & Stubbing

### External Services

**Mocked Services:**
- Supabase Client
- Redis Client
- SendGrid Mail
- Twilio SMS/WhatsApp
- OpenAI GPT-4
- Anthropic Claude
- Razorpay Payment Gateway
- Multer File Uploads

### API Responses

**Mocked Endpoints:**
- Hotel search and details
- Flight search and booking
- Payment processing
- Notification sending
- AI itinerary generation

## Coverage Requirements

### Code Coverage Targets

- **Lines:** 85%+ (Target: 80%)
- **Functions:** 90%+ (Target: 85%)
- **Branches:** 80%+ (Target: 75%)
- **Statements:** 85%+ (Target: 80%)

### Test Coverage Areas

- ✅ Authentication & Authorization
- ✅ CRUD Operations
- ✅ Search & Filtering
- ✅ Payment Processing
- ✅ Notification System
- ✅ AI Integration
- ✅ File Uploads
- ✅ Error Handling
- ✅ Security Middleware
- ✅ Rate Limiting

## Performance Testing

### API Performance

- **Response Time:** <200ms (Target: <500ms)
- **Database Queries:** <100ms (Target: <200ms)
- **External API Calls:** <2s (Target: <5s)
- **File Uploads:** <5s (Target: <10s)

### Frontend Performance

- **Page Load Time:** <2s (Target: <3s)
- **Time to Interactive:** <3s (Target: <5s)
- **Bundle Size:** <500KB (Target: <1MB)
- **Lighthouse Score:** 90+ (Target: 80+)

## Security Testing

### Security Test Coverage

- ✅ Authentication & Authorization
- ✅ Input Validation & Sanitization
- ✅ SQL Injection Prevention
- ✅ XSS Protection
- ✅ CSRF Protection
- ✅ Rate Limiting
- ✅ Data Encryption
- ✅ RLS Policy Enforcement
- ✅ JWT Token Validation
- ✅ API Key Security

## Continuous Integration

### CI/CD Pipeline

```yaml
# Example GitHub Actions workflow
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: cd server && npm install
      - run: npm run test:jest:ci
      - run: npm run test:cypress:headless
      - run: npm run test:coverage
```

## Troubleshooting

### Common Issues

1. **Test Timeouts:**
   - Increase timeout values in configuration
   - Check for slow external API calls
   - Verify database connection

2. **Mock Failures:**
   - Ensure mocks are properly configured
   - Check mock data matches expected format
   - Verify mock timing

3. **Cypress Flaky Tests:**
   - Add proper waits for API calls
   - Use data-testid attributes consistently
   - Implement retry logic for flaky operations

### Debug Commands

```bash
# Debug Jest tests
npm run test:jest -- --verbose --no-cache

# Debug Cypress tests
npm run test:cypress:open

# Check test coverage
npm run test:coverage
```

## Best Practices

### Test Writing

1. **Use Descriptive Test Names**
2. **Follow AAA Pattern** (Arrange, Act, Assert)
3. **Mock External Dependencies**
4. **Test Edge Cases and Error Scenarios**
5. **Keep Tests Independent and Isolated**
6. **Use Data Test IDs for E2E Tests**
7. **Implement Proper Cleanup**

### Test Organization

1. **Group Related Tests**
2. **Use Setup and Teardown Hooks**
3. **Share Common Test Utilities**
4. **Maintain Test Data Fixtures**
5. **Document Test Scenarios**

## Conclusion

This comprehensive testing suite ensures the travel booking application is robust, secure, and user-friendly. The combination of Jest API tests and Cypress E2E tests provides complete coverage of both backend functionality and frontend user experience.

**Key Benefits:**
- ✅ Complete API Coverage
- ✅ End-to-End User Flows
- ✅ Security Testing
- ✅ Performance Validation
- ✅ Accessibility Compliance
- ✅ Responsive Design Testing
- ✅ Continuous Integration Ready
- ✅ Production Deployment Confidence

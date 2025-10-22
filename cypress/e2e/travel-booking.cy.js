// Cypress E2E Tests for Travel Booking Application
// This file contains comprehensive end-to-end tests for all major user flows

describe('Travel Booking Application E2E Tests', () => {
  beforeEach(() => {
    // Visit the application
    cy.visit('/');
    
    // Mock API responses
    cy.intercept('GET', '/api/hotels*', { fixture: 'hotels.json' }).as('getHotels');
    cy.intercept('GET', '/api/flights/search*', { fixture: 'flights.json' }).as('getFlights');
    cy.intercept('POST', '/api/bookings', { fixture: 'booking.json' }).as('createBooking');
    cy.intercept('POST', '/api/payments/create-order', { fixture: 'payment-order.json' }).as('createPaymentOrder');
    cy.intercept('POST', '/api/ai/itinerary', { fixture: 'itinerary.json' }).as('generateItinerary');
  });

  // =============================================================================
  // AUTHENTICATION FLOWS
  // =============================================================================

  describe('Authentication', () => {
    it('should allow user registration', () => {
      cy.visit('/auth');
      
      // Fill registration form
      cy.get('[data-testid="signup-email"]').type('test@example.com');
      cy.get('[data-testid="signup-password"]').type('TestPassword123!');
      cy.get('[data-testid="signup-confirm-password"]').type('TestPassword123!');
      cy.get('[data-testid="signup-first-name"]').type('John');
      cy.get('[data-testid="signup-last-name"]').type('Doe');
      
      // Submit form
      cy.get('[data-testid="signup-submit"]').click();
      
      // Verify success message
      cy.get('[data-testid="success-message"]').should('contain', 'Account created successfully');
    });

    it('should allow user login', () => {
      cy.visit('/auth');
      
      // Switch to login tab
      cy.get('[data-testid="login-tab"]').click();
      
      // Fill login form
      cy.get('[data-testid="login-email"]').type('test@example.com');
      cy.get('[data-testid="login-password"]').type('TestPassword123!');
      
      // Submit form
      cy.get('[data-testid="login-submit"]').click();
      
      // Verify redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-menu"]').should('be.visible');
    });

    it('should handle login errors', () => {
      cy.visit('/auth');
      
      // Fill invalid credentials
      cy.get('[data-testid="login-email"]').type('invalid@example.com');
      cy.get('[data-testid="login-password"]').type('wrongpassword');
      
      // Submit form
      cy.get('[data-testid="login-submit"]').click();
      
      // Verify error message
      cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials');
    });
  });

  // =============================================================================
  // HOTEL BOOKING FLOW
  // =============================================================================

  describe('Hotel Booking Flow', () => {
    beforeEach(() => {
      // Login before each test
      cy.login('test@example.com', 'TestPassword123!');
    });

    it('should complete hotel search and booking', () => {
      // Navigate to hotels page
      cy.visit('/hotels');
      
      // Search for hotels
      cy.get('[data-testid="search-destination"]').type('Mumbai');
      cy.get('[data-testid="search-checkin"]').type('2024-12-20');
      cy.get('[data-testid="search-checkout"]').type('2024-12-22');
      cy.get('[data-testid="search-guests"]').type('2');
      
      // Submit search
      cy.get('[data-testid="search-submit"]').click();
      
      // Wait for results
      cy.wait('@getHotels');
      cy.get('[data-testid="hotel-card"]').should('have.length.at.least', 1);
      
      // Select a hotel
      cy.get('[data-testid="hotel-card"]').first().click();
      
      // Verify hotel details page
      cy.url().should('include', '/hotels/');
      cy.get('[data-testid="hotel-name"]').should('be.visible');
      cy.get('[data-testid="hotel-price"]').should('be.visible');
      
      // Click book now
      cy.get('[data-testid="book-now-button"]').click();
      
      // Verify booking form
      cy.get('[data-testid="booking-form"]').should('be.visible');
      
      // Fill guest information
      cy.get('[data-testid="guest-name"]').type('John Doe');
      cy.get('[data-testid="guest-email"]').type('john@example.com');
      cy.get('[data-testid="guest-phone"]').type('+1234567890');
      
      // Add special requests
      cy.get('[data-testid="special-requests"]').type('Late checkout requested');
      
      // Proceed to payment
      cy.get('[data-testid="proceed-payment"]').click();
      
      // Verify payment step
      cy.get('[data-testid="payment-step"]').should('be.visible');
      cy.get('[data-testid="total-amount"]').should('contain', '₹');
      
      // Complete booking
      cy.get('[data-testid="complete-booking"]').click();
      
      // Verify booking confirmation
      cy.get('[data-testid="booking-confirmation"]').should('be.visible');
      cy.get('[data-testid="booking-reference"]').should('be.visible');
    });

    it('should filter hotels by price range', () => {
      cy.visit('/hotels');
      
      // Set price filter
      cy.get('[data-testid="price-filter-min"]').type('1000');
      cy.get('[data-testid="price-filter-max"]').type('5000');
      
      // Apply filter
      cy.get('[data-testid="apply-filters"]').click();
      
      // Verify filtered results
      cy.get('[data-testid="hotel-card"]').each(($card) => {
        cy.wrap($card).find('[data-testid="hotel-price"]').should('contain', '₹');
      });
    });

    it('should filter hotels by amenities', () => {
      cy.visit('/hotels');
      
      // Select amenities
      cy.get('[data-testid="amenity-wifi"]').check();
      cy.get('[data-testid="amenity-pool"]').check();
      
      // Apply filter
      cy.get('[data-testid="apply-filters"]').click();
      
      // Verify filtered results show selected amenities
      cy.get('[data-testid="hotel-card"]').should('contain', 'WiFi');
      cy.get('[data-testid="hotel-card"]').should('contain', 'Pool');
    });
  });

  // =============================================================================
  // FLIGHT BOOKING FLOW
  // =============================================================================

  describe('Flight Booking Flow', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'TestPassword123!');
    });

    it('should complete flight search and booking', () => {
      // Navigate to flights page
      cy.visit('/flights');
      
      // Search for flights
      cy.get('[data-testid="flight-origin"]').type('Mumbai');
      cy.get('[data-testid="flight-destination"]').type('Delhi');
      cy.get('[data-testid="flight-departure-date"]').type('2024-12-15');
      cy.get('[data-testid="flight-passengers"]').type('1');
      
      // Submit search
      cy.get('[data-testid="flight-search-submit"]').click();
      
      // Wait for results
      cy.wait('@getFlights');
      cy.get('[data-testid="flight-card"]').should('have.length.at.least', 1);
      
      // Select a flight
      cy.get('[data-testid="flight-card"]').first().click();
      
      // Verify flight details
      cy.get('[data-testid="flight-airline"]').should('be.visible');
      cy.get('[data-testid="flight-price"]').should('be.visible');
      
      // Click book now
      cy.get('[data-testid="book-flight-button"]').click();
      
      // Fill passenger information
      cy.get('[data-testid="passenger-name"]').type('John Doe');
      cy.get('[data-testid="passenger-email"]').type('john@example.com');
      cy.get('[data-testid="passenger-phone"]').type('+1234567890');
      
      // Add seat preference
      cy.get('[data-testid="seat-preference"]').select('Window');
      
      // Proceed to payment
      cy.get('[data-testid="proceed-flight-payment"]').click();
      
      // Complete booking
      cy.get('[data-testid="complete-flight-booking"]').click();
      
      // Verify booking confirmation
      cy.get('[data-testid="flight-booking-confirmation"]').should('be.visible');
    });

    it('should filter flights by price', () => {
      cy.visit('/flights');
      
      // Set price filter
      cy.get('[data-testid="flight-price-filter"]').type('5000');
      
      // Apply filter
      cy.get('[data-testid="apply-flight-filters"]').click();
      
      // Verify filtered results
      cy.get('[data-testid="flight-card"]').each(($card) => {
        cy.wrap($card).find('[data-testid="flight-price"]').should('contain', '₹');
      });
    });

    it('should filter flights by airline', () => {
      cy.visit('/flights');
      
      // Select airline
      cy.get('[data-testid="airline-filter"]').select('Air India');
      
      // Apply filter
      cy.get('[data-testid="apply-flight-filters"]').click();
      
      // Verify filtered results
      cy.get('[data-testid="flight-card"]').should('contain', 'Air India');
    });
  });

  // =============================================================================
  // TOUR BOOKING FLOW
  // =============================================================================

  describe('Tour Booking Flow', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'TestPassword123!');
    });

    it('should complete tour search and booking', () => {
      // Navigate to tours page
      cy.visit('/tours');
      
      // Search for tours
      cy.get('[data-testid="tour-destination"]').type('Mumbai');
      cy.get('[data-testid="tour-duration"]').select('1 day');
      cy.get('[data-testid="tour-type"]').select('Cultural');
      
      // Submit search
      cy.get('[data-testid="tour-search-submit"]').click();
      
      // Wait for results
      cy.get('[data-testid="tour-card"]').should('have.length.at.least', 1);
      
      // Select a tour
      cy.get('[data-testid="tour-card"]').first().click();
      
      // Verify tour details
      cy.get('[data-testid="tour-name"]').should('be.visible');
      cy.get('[data-testid="tour-price"]').should('be.visible');
      cy.get('[data-testid="tour-itinerary"]').should('be.visible');
      
      // Click book now
      cy.get('[data-testid="book-tour-button"]').click();
      
      // Fill participant information
      cy.get('[data-testid="participant-name"]').type('John Doe');
      cy.get('[data-testid="participant-email"]').type('john@example.com');
      cy.get('[data-testid="participant-phone"]').type('+1234567890');
      
      // Select tour date
      cy.get('[data-testid="tour-date"]').type('2024-12-20');
      
      // Add dietary preferences
      cy.get('[data-testid="dietary-preferences"]').type('Vegetarian');
      
      // Proceed to payment
      cy.get('[data-testid="proceed-tour-payment"]').click();
      
      // Complete booking
      cy.get('[data-testid="complete-tour-booking"]').click();
      
      // Verify booking confirmation
      cy.get('[data-testid="tour-booking-confirmation"]').should('be.visible');
    });
  });

  // =============================================================================
  // AI ITINERARY FLOW
  // =============================================================================

  describe('AI Itinerary Generation', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'TestPassword123!');
    });

    it('should generate AI itinerary', () => {
      // Navigate to AI itinerary page
      cy.visit('/ai-itinerary');
      
      // Fill itinerary preferences
      cy.get('[data-testid="itinerary-destination"]').type('Mumbai, India');
      cy.get('[data-testid="itinerary-start-date"]').type('2024-12-15');
      cy.get('[data-testid="itinerary-end-date"]').type('2024-12-18');
      cy.get('[data-testid="itinerary-travelers"]').type('2');
      
      // Set budget
      cy.get('[data-testid="budget-min"]').type('10000');
      cy.get('[data-testid="budget-max"]').type('25000');
      
      // Select interests
      cy.get('[data-testid="interest-culture"]').check();
      cy.get('[data-testid="interest-food"]').check();
      cy.get('[data-testid="interest-history"]').check();
      
      // Select AI provider
      cy.get('[data-testid="ai-provider-openai"]').check();
      
      // Add special requirements
      cy.get('[data-testid="special-requirements"]').type('Vegetarian food preferences');
      
      // Generate itinerary
      cy.get('[data-testid="generate-itinerary"]').click();
      
      // Wait for generation
      cy.wait('@generateItinerary');
      
      // Verify itinerary generated
      cy.get('[data-testid="itinerary-title"]').should('be.visible');
      cy.get('[data-testid="itinerary-days"]').should('have.length.at.least', 1);
      
      // Verify day details
      cy.get('[data-testid="itinerary-day-1"]').should('be.visible');
      cy.get('[data-testid="day-activities"]').should('have.length.at.least', 1);
      cy.get('[data-testid="day-meals"]').should('have.length.at.least', 1);
      
      // Verify summary
      cy.get('[data-testid="itinerary-summary"]').should('be.visible');
      cy.get('[data-testid="total-cost"]').should('contain', '₹');
    });

    it('should save itinerary', () => {
      // Generate itinerary first
      cy.visit('/ai-itinerary');
      cy.get('[data-testid="itinerary-destination"]').type('Mumbai, India');
      cy.get('[data-testid="itinerary-start-date"]').type('2024-12-15');
      cy.get('[data-testid="itinerary-end-date"]').type('2024-12-18');
      cy.get('[data-testid="itinerary-travelers"]').type('2');
      cy.get('[data-testid="generate-itinerary"]').click();
      
      cy.wait('@generateItinerary');
      
      // Save itinerary
      cy.get('[data-testid="save-itinerary"]').click();
      
      // Verify save success
      cy.get('[data-testid="save-success"]').should('contain', 'Itinerary saved successfully');
    });

    it('should convert itinerary to booking', () => {
      // Generate and save itinerary
      cy.visit('/ai-itinerary');
      cy.get('[data-testid="itinerary-destination"]').type('Mumbai, India');
      cy.get('[data-testid="itinerary-start-date"]').type('2024-12-15');
      cy.get('[data-testid="itinerary-end-date"]').type('2024-12-18');
      cy.get('[data-testid="itinerary-travelers"]').type('2');
      cy.get('[data-testid="generate-itinerary"]').click();
      
      cy.wait('@generateItinerary');
      cy.get('[data-testid="save-itinerary"]').click();
      
      // Convert to booking
      cy.get('[data-testid="convert-to-booking"]').click();
      
      // Verify booking form
      cy.get('[data-testid="booking-form"]').should('be.visible');
      
      // Fill booking details
      cy.get('[data-testid="booking-guest-name"]').type('John Doe');
      cy.get('[data-testid="booking-guest-email"]').type('john@example.com');
      
      // Complete booking
      cy.get('[data-testid="complete-booking"]').click();
      
      // Verify booking confirmation
      cy.get('[data-testid="booking-confirmation"]').should('be.visible');
    });
  });

  // =============================================================================
  // PAYMENT FLOW
  // =============================================================================

  describe('Payment Processing', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'TestPassword123!');
    });

    it('should process Razorpay payment', () => {
      // Start booking process
      cy.visit('/hotels');
      cy.get('[data-testid="search-destination"]').type('Mumbai');
      cy.get('[data-testid="search-checkin"]').type('2024-12-20');
      cy.get('[data-testid="search-checkout"]').type('2024-12-22');
      cy.get('[data-testid="search-submit"]').click();
      
      cy.get('[data-testid="hotel-card"]').first().click();
      cy.get('[data-testid="book-now-button"]').click();
      
      // Fill booking form
      cy.get('[data-testid="guest-name"]').type('John Doe');
      cy.get('[data-testid="guest-email"]').type('john@example.com');
      cy.get('[data-testid="proceed-payment"]').click();
      
      // Mock Razorpay payment
      cy.window().then((win) => {
        win.Razorpay = {
          open: cy.stub().callsFake((options) => {
            // Simulate successful payment
            options.handler({
              razorpay_payment_id: 'pay_test123',
              razorpay_order_id: 'order_test123',
              razorpay_signature: 'signature_test123'
            });
          })
        };
      });
      
      // Complete payment
      cy.get('[data-testid="complete-payment"]').click();
      
      // Verify payment success
      cy.get('[data-testid="payment-success"]').should('be.visible');
      cy.get('[data-testid="booking-reference"]').should('be.visible');
    });

    it('should handle payment failure', () => {
      // Start booking process
      cy.visit('/hotels');
      cy.get('[data-testid="search-destination"]').type('Mumbai');
      cy.get('[data-testid="search-checkin"]').type('2024-12-20');
      cy.get('[data-testid="search-checkout"]').type('2024-12-22');
      cy.get('[data-testid="search-submit"]').click();
      
      cy.get('[data-testid="hotel-card"]').first().click();
      cy.get('[data-testid="book-now-button"]').click();
      
      // Fill booking form
      cy.get('[data-testid="guest-name"]').type('John Doe');
      cy.get('[data-testid="guest-email"]').type('john@example.com');
      cy.get('[data-testid="proceed-payment"]').click();
      
      // Mock Razorpay payment failure
      cy.window().then((win) => {
        win.Razorpay = {
          open: cy.stub().callsFake((options) => {
            // Simulate payment failure
            options.modal = {
              close: cy.stub()
            };
            setTimeout(() => {
              options.modal.close();
            }, 100);
          })
        };
      });
      
      // Attempt payment
      cy.get('[data-testid="complete-payment"]').click();
      
      // Verify payment failure handling
      cy.get('[data-testid="payment-failed"]').should('be.visible');
      cy.get('[data-testid="retry-payment"]').should('be.visible');
    });
  });

  // =============================================================================
  // NOTIFICATIONS FLOW
  // =============================================================================

  describe('Notifications', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'TestPassword123!');
    });

    it('should receive booking confirmation notification', () => {
      // Complete a booking
      cy.visit('/hotels');
      cy.get('[data-testid="search-destination"]').type('Mumbai');
      cy.get('[data-testid="search-checkin"]').type('2024-12-20');
      cy.get('[data-testid="search-checkout"]').type('2024-12-22');
      cy.get('[data-testid="search-submit"]').click();
      
      cy.get('[data-testid="hotel-card"]').first().click();
      cy.get('[data-testid="book-now-button"]').click();
      
      // Complete booking
      cy.get('[data-testid="guest-name"]').type('John Doe');
      cy.get('[data-testid="guest-email"]').type('john@example.com');
      cy.get('[data-testid="proceed-payment"]').click();
      cy.get('[data-testid="complete-payment"]').click();
      
      // Check notifications
      cy.get('[data-testid="notifications-bell"]').click();
      
      // Verify notification received
      cy.get('[data-testid="notification-item"]').should('contain', 'Booking Confirmed');
      cy.get('[data-testid="notification-item"]').should('contain', 'Your booking has been confirmed');
    });

    it('should receive payment receipt notification', () => {
      // Complete a booking with payment
      cy.visit('/hotels');
      cy.get('[data-testid="search-destination"]').type('Mumbai');
      cy.get('[data-testid="search-checkin"]').type('2024-12-20');
      cy.get('[data-testid="search-checkout"]').type('2024-12-22');
      cy.get('[data-testid="search-submit"]').click();
      
      cy.get('[data-testid="hotel-card"]').first().click();
      cy.get('[data-testid="book-now-button"]').click();
      
      // Complete booking and payment
      cy.get('[data-testid="guest-name"]').type('John Doe');
      cy.get('[data-testid="guest-email"]').type('john@example.com');
      cy.get('[data-testid="proceed-payment"]').click();
      cy.get('[data-testid="complete-payment"]').click();
      
      // Check notifications
      cy.get('[data-testid="notifications-bell"]').click();
      
      // Verify payment receipt notification
      cy.get('[data-testid="notification-item"]').should('contain', 'Payment Receipt');
      cy.get('[data-testid="notification-item"]').should('contain', 'Payment of ₹');
    });
  });

  // =============================================================================
  // USER DASHBOARD FLOW
  // =============================================================================

  describe('User Dashboard', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'TestPassword123!');
    });

    it('should display user bookings', () => {
      // Navigate to dashboard
      cy.visit('/dashboard');
      
      // Verify bookings section
      cy.get('[data-testid="bookings-section"]').should('be.visible');
      cy.get('[data-testid="booking-item"]').should('have.length.at.least', 1);
      
      // Verify booking details
      cy.get('[data-testid="booking-item"]').first().within(() => {
        cy.get('[data-testid="booking-reference"]').should('be.visible');
        cy.get('[data-testid="booking-status"]').should('be.visible');
        cy.get('[data-testid="booking-amount"]').should('be.visible');
      });
    });

    it('should display user itineraries', () => {
      // Navigate to dashboard
      cy.visit('/dashboard');
      
      // Verify itineraries section
      cy.get('[data-testid="itineraries-section"]').should('be.visible');
      cy.get('[data-testid="itinerary-item"]').should('have.length.at.least', 1);
      
      // Verify itinerary details
      cy.get('[data-testid="itinerary-item"]').first().within(() => {
        cy.get('[data-testid="itinerary-title"]').should('be.visible');
        cy.get('[data-testid="itinerary-destination"]').should('be.visible');
        cy.get('[data-testid="itinerary-duration"]').should('be.visible');
      });
    });

    it('should allow booking cancellation', () => {
      // Navigate to dashboard
      cy.visit('/dashboard');
      
      // Find a cancellable booking
      cy.get('[data-testid="booking-item"]').first().within(() => {
        cy.get('[data-testid="booking-status"]').then(($status) => {
          if ($status.text().includes('confirmed')) {
            cy.get('[data-testid="cancel-booking"]').click();
            
            // Confirm cancellation
            cy.get('[data-testid="confirm-cancellation"]').click();
            
            // Verify cancellation success
            cy.get('[data-testid="cancellation-success"]').should('be.visible');
          }
        });
      });
    });
  });

  // =============================================================================
  // RESPONSIVE DESIGN TESTS
  // =============================================================================

  describe('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      
      // Verify mobile navigation
      cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
      cy.get('[data-testid="mobile-menu-button"]').click();
      cy.get('[data-testid="mobile-menu"]').should('be.visible');
      
      // Test mobile hotel search
      cy.get('[data-testid="mobile-menu-hotels"]').click();
      cy.get('[data-testid="search-destination"]').should('be.visible');
    });

    it('should work on tablet devices', () => {
      cy.viewport('ipad-2');
      cy.visit('/');
      
      // Verify tablet layout
      cy.get('[data-testid="main-navigation"]').should('be.visible');
      cy.get('[data-testid="search-form"]').should('be.visible');
    });
  });

  // =============================================================================
  // ACCESSIBILITY TESTS
  // =============================================================================

  describe('Accessibility', () => {
    it('should be accessible with keyboard navigation', () => {
      cy.visit('/');
      
      // Tab through navigation
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'main-navigation');
      
      // Tab to search form
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'search-destination');
    });

    it('should have proper ARIA labels', () => {
      cy.visit('/');
      
      // Check for ARIA labels
      cy.get('[data-testid="search-destination"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="search-submit"]').should('have.attr', 'aria-label');
    });
  });

  // =============================================================================
  // PERFORMANCE TESTS
  // =============================================================================

  describe('Performance', () => {
    it('should load pages within acceptable time', () => {
      cy.visit('/', {
        onBeforeLoad: (win) => {
          win.performance.mark('page-start');
        }
      });
      
      cy.window().then((win) => {
        win.performance.mark('page-end');
        win.performance.measure('page-load', 'page-start', 'page-end');
        
        const measure = win.performance.getEntriesByName('page-load')[0];
        expect(measure.duration).to.be.lessThan(3000); // 3 seconds
      });
    });

    it('should handle large datasets efficiently', () => {
      cy.visit('/hotels');
      
      // Mock large dataset
      cy.intercept('GET', '/api/hotels*', { fixture: 'hotels-large.json' }).as('getLargeHotels');
      
      cy.get('[data-testid="search-submit"]').click();
      cy.wait('@getLargeHotels');
      
      // Verify pagination works
      cy.get('[data-testid="pagination"]').should('be.visible');
      cy.get('[data-testid="pagination-next"]').should('be.visible');
    });
  });
});

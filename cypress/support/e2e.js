// Cypress support file for E2E tests
import './commands';

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions
  // that are not related to the test
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});

// Custom commands
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/auth');
    cy.get('[data-testid="login-email"]').type(email);
    cy.get('[data-testid="login-password"]').type(password);
    cy.get('[data-testid="login-submit"]').click();
    cy.url().should('include', '/dashboard');
  });
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/auth');
});

Cypress.Commands.add('mockApi', (method, url, response) => {
  cy.intercept(method, url, response);
});

Cypress.Commands.add('waitForApi', (alias) => {
  cy.wait(alias);
});

Cypress.Commands.add('clearStorage', () => {
  cy.clearLocalStorage();
  cy.clearCookies();
});

// Custom assertions
Cypress.Commands.add('shouldBeVisible', { prevSubject: true }, (subject) => {
  cy.wrap(subject).should('be.visible');
});

Cypress.Commands.add('shouldContainText', { prevSubject: true }, (subject, text) => {
  cy.wrap(subject).should('contain.text', text);
});

// Test data helpers
Cypress.Commands.add('createTestBooking', () => {
  cy.request('POST', '/api/bookings', {
    item_type: 'hotel',
    item_id: 'test-hotel-id',
    check_in_date: '2024-12-20',
    check_out_date: '2024-12-22',
    guests: 2
  });
});

Cypress.Commands.add('createTestItinerary', () => {
  cy.request('POST', '/api/ai/itinerary', {
    destination: 'Mumbai, India',
    startDate: '2024-12-15T00:00:00Z',
    endDate: '2024-12-18T23:59:59Z',
    travelers: 2,
    budget: { min: 10000, max: 25000, currency: 'INR' },
    interests: ['culture', 'food'],
    aiProvider: 'openai'
  });
});

// Cypress configuration file
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // Implement node event listeners here
      on('task', {
        // Custom tasks for testing
        log(message) {
          console.log(message);
          return null;
        },
        
        // Mock external API calls
        mockApiResponse(url, response) {
          return null;
        },
        
        // Clear test data
        clearTestData() {
          return null;
        }
      });
    },
    env: {
      // Environment variables for testing
      API_BASE_URL: 'http://localhost:8000/api',
      TEST_USER_EMAIL: 'test@example.com',
      TEST_USER_PASSWORD: 'TestPassword123!',
      ADMIN_EMAIL: 'admin@example.com',
      ADMIN_PASSWORD: 'AdminPassword123!'
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    downloadsFolder: 'cypress/downloads'
  },
  
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js'
  }
});

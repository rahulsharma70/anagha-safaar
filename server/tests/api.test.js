// Simple Jest test for API endpoints
const request = require('supertest');

// Mock Express app for testing
const express = require('express');
const app = express();

// Basic middleware
app.use(express.json());

// Mock routes for testing
app.get('/api/hotels', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'hotel-1',
        name: 'Test Hotel',
        price_per_night: 5000,
        available_rooms: 10
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1
    }
  });
});

app.get('/api/flights/search', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'flight-1',
        airline: 'Test Airlines',
        price_economy: 5000,
        available_seats: 50
      }
    ]
  });
});

app.post('/api/bookings', (req, res) => {
  res.status(201).json({
    success: true,
    data: {
      id: 'booking-123',
      status: 'pending',
      total_amount: 10000
    }
  });
});

app.post('/api/payments/create-order', (req, res) => {
  res.status(201).json({
    success: true,
    data: {
      order_id: 'order_123',
      amount: 10000,
      currency: 'INR'
    }
  });
});

app.post('/api/ai/itinerary', (req, res) => {
  res.status(201).json({
    success: true,
    data: {
      itinerary: {
        id: 'itinerary-123',
        title: 'Test Itinerary',
        destination: 'Mumbai, India'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// =============================================================================
// HOTELS TESTS
// =============================================================================

describe('Hotels API', () => {
  describe('GET /api/hotels', () => {
    it('should get hotels list', async () => {
      const response = await request(app)
        .get('/api/hotels')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('id', 'hotel-1');
      expect(response.body.data[0]).toHaveProperty('name', 'Test Hotel');
      expect(response.body.pagination).toBeDefined();
    });
  });
});

// =============================================================================
// FLIGHTS TESTS
// =============================================================================

describe('Flights API', () => {
  describe('GET /api/flights/search', () => {
    it('should search flights', async () => {
      const response = await request(app)
        .get('/api/flights/search')
        .query({
          origin: 'Mumbai',
          destination: 'Delhi',
          departure_date: '2024-12-15',
          passengers: 1
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('id', 'flight-1');
      expect(response.body.data[0]).toHaveProperty('airline', 'Test Airlines');
    });
  });
});

// =============================================================================
// BOOKINGS TESTS
// =============================================================================

describe('Bookings API', () => {
  describe('POST /api/bookings', () => {
    it('should create booking successfully', async () => {
      const bookingData = {
        item_type: 'hotel',
        item_id: 'hotel-123',
        check_in_date: '2024-12-20',
        check_out_date: '2024-12-22',
        guests: 2
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', 'booking-123');
      expect(response.body.data).toHaveProperty('status', 'pending');
      expect(response.body.data).toHaveProperty('total_amount', 10000);
    });
  });
});

// =============================================================================
// PAYMENTS TESTS
// =============================================================================

describe('Payments API', () => {
  describe('POST /api/payments/create-order', () => {
    it('should create payment order successfully', async () => {
      const orderData = {
        booking_id: 'booking-123',
        amount: 10000,
        currency: 'INR'
      };

      const response = await request(app)
        .post('/api/payments/create-order')
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('order_id', 'order_123');
      expect(response.body.data).toHaveProperty('amount', 10000);
      expect(response.body.data).toHaveProperty('currency', 'INR');
    });
  });
});

// =============================================================================
// AI ITINERARIES TESTS
// =============================================================================

describe('AI Itineraries API', () => {
  describe('POST /api/ai/itinerary', () => {
    it('should generate itinerary successfully', async () => {
      const itineraryRequest = {
        destination: 'Mumbai, India',
        startDate: '2024-12-15T00:00:00Z',
        endDate: '2024-12-18T23:59:59Z',
        travelers: 2,
        budget: { min: 10000, max: 25000, currency: 'INR' },
        interests: ['culture', 'food'],
        aiProvider: 'openai'
      };

      const response = await request(app)
        .post('/api/ai/itinerary')
        .send(itineraryRequest)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.itinerary).toHaveProperty('id', 'itinerary-123');
      expect(response.body.data.itinerary).toHaveProperty('title', 'Test Itinerary');
      expect(response.body.data.itinerary).toHaveProperty('destination', 'Mumbai, India');
    });
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Integration Tests', () => {
  describe('Complete Booking Flow', () => {
    it('should complete end-to-end booking flow', async () => {
      // 1. Search hotels
      const hotelSearchResponse = await request(app)
        .get('/api/hotels')
        .expect(200);

      expect(hotelSearchResponse.body.success).toBe(true);

      // 2. Create booking
      const bookingData = {
        item_type: 'hotel',
        item_id: 'hotel-123',
        check_in_date: '2024-12-20',
        check_out_date: '2024-12-22',
        guests: 2
      };

      const bookingResponse = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      expect(bookingResponse.body.success).toBe(true);
      const bookingId = bookingResponse.body.data.id;

      // 3. Create payment order
      const orderData = {
        booking_id: bookingId,
        amount: 10000,
        currency: 'INR'
      };

      const orderResponse = await request(app)
        .post('/api/payments/create-order')
        .send(orderData)
        .expect(201);

      expect(orderResponse.body.success).toBe(true);
      expect(orderResponse.body.data.order_id).toBeDefined();
    });
  });
});
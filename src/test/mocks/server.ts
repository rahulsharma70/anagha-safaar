import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Supabase API mocks
  http.get('https://test.supabase.co/rest/v1/hotels', () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'Test Hotel',
        location_city: 'Delhi',
        location_state: 'Delhi',
        price_per_night: 5000,
        star_rating: 4,
        images: ['https://example.com/hotel.jpg'],
        is_featured: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ])
  }),

  http.get('https://test.supabase.co/rest/v1/flights', () => {
    return HttpResponse.json([
      {
        id: '1',
        airline: 'Air India',
        flight_number: 'AI101',
        departure_city: 'Delhi',
        arrival_city: 'Mumbai',
        departure_time: '2024-01-15T10:00:00Z',
        arrival_time: '2024-01-15T12:00:00Z',
        price_economy: 8000,
        price_business: 15000,
        available_seats: 50,
        is_featured: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ])
  }),

  http.get('https://test.supabase.co/rest/v1/tours', () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'Golden Triangle Tour',
        location_city: 'Delhi',
        location_state: 'Delhi',
        duration_days: 7,
        price_per_person: 25000,
        difficulty: 'Easy',
        tour_type: 'Cultural',
        images: ['https://example.com/tour.jpg'],
        is_featured: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ])
  }),

  // Amadeus API mocks
  http.get('https://api.amadeus.com/v1/security/oauth2/token', () => {
    return HttpResponse.json({
      access_token: 'test-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
    })
  }),

  http.get('https://api.amadeus.com/v1/shopping/hotel-offers', () => {
    return HttpResponse.json({
      data: [
        {
          hotel: {
            hotelId: 'AMADEUS_HOTEL_1',
            name: 'Amadeus Test Hotel',
            description: { text: 'A beautiful test hotel' },
            rating: 4.5,
            amenities: ['WiFi', 'Pool', 'Spa'],
            address: {
              cityName: 'Delhi',
              stateCode: 'DL',
              countryCode: 'IN',
            },
            geoCode: {
              latitude: 28.6139,
              longitude: 77.2090,
            },
          },
          offers: [
            {
              price: {
                total: '5000.00',
                currency: 'INR',
              },
              room: {
                numberOfRooms: 1,
              },
            },
          ],
        },
      ],
    })
  }),

  http.get('https://api.amadeus.com/v1/shopping/flight-offers', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'AMADEUS_FLIGHT_1',
          price: {
            total: '8000.00',
            currency: 'INR',
          },
          numberOfBookableSeats: 9,
          travelerPricings: [
            {
              fareDetailsBySegment: [
                {
                  cabin: 'ECONOMY',
                },
              ],
            },
          ],
          itineraries: [
            {
              duration: 'PT2H30M',
              segments: [
                {
                  carrierCode: 'AI',
                  number: '101',
                  departure: {
                    iataCode: 'DEL',
                    at: '2024-01-15T10:00:00',
                  },
                  arrival: {
                    iataCode: 'BOM',
                    at: '2024-01-15T12:30:00',
                  },
                },
              ],
            },
          ],
        },
      ],
    })
  }),

  // Razorpay API mocks
  http.post('https://api.razorpay.com/v1/orders', () => {
    return HttpResponse.json({
      id: 'order_test_123',
      amount: 500000,
      currency: 'INR',
      receipt: 'receipt_test_123',
      status: 'created',
      created_at: 1640995200,
    })
  }),

  // OpenAI API mocks
  http.post('https://api.openai.com/v1/chat/completions', () => {
    return HttpResponse.json({
      choices: [
        {
          message: {
            content: JSON.stringify({
              destination: 'Goa',
              duration: 5,
              totalCost: 50000,
              currency: 'INR',
              days: [
                {
                  day: 1,
                  date: '2024-01-15',
                  activities: [
                    {
                      id: 'activity_1',
                      name: 'Beach Visit',
                      description: 'Visit Calangute Beach',
                      duration: '4 hours',
                      cost: 2000,
                      location: 'Calangute',
                      time: '09:00',
                      category: 'beaches',
                      bookingRequired: false,
                    },
                  ],
                  meals: [
                    {
                      id: 'meal_1',
                      name: 'Local Lunch',
                      type: 'lunch',
                      cost: 500,
                      location: 'Calangute',
                      time: '13:00',
                      cuisine: 'Goan',
                      description: 'Traditional Goan cuisine',
                    },
                  ],
                  estimatedCost: 2500,
                },
              ],
              summary: 'A wonderful 5-day trip to Goa',
              highlights: ['Beach visits', 'Local cuisine', 'Water sports'],
              tips: ['Carry sunscreen', 'Book water sports in advance'],
            }),
          },
        },
      ],
    })
  }),

  // SendGrid API mocks
  http.post('https://api.sendgrid.com/v3/mail/send', () => {
    return HttpResponse.json({}, { status: 202 })
  }),

  // Twilio API mocks
  http.post('https://api.twilio.com/2010-04-01/Accounts/*/Messages.json', () => {
    return HttpResponse.json({
      sid: 'SM_test_123',
      status: 'sent',
    })
  }),
]

export const server = setupServer(...handlers)

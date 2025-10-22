// Test fixtures for API responses
const hotels = [
  {
    id: 'hotel-1',
    name: 'Taj Palace Hotel Mumbai',
    slug: 'taj-palace-hotel-mumbai',
    description: 'Luxury 5-star hotel in the heart of Mumbai',
    location_city: 'Mumbai',
    location_state: 'Maharashtra',
    price_per_night: 15000,
    available_rooms: 10,
    total_rooms: 50,
    star_rating: 5,
    amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant'],
    is_featured: true,
    is_active: true,
    images: ['https://example.com/hotel1.jpg']
  },
  {
    id: 'hotel-2',
    name: 'Oberoi Mumbai',
    slug: 'oberoi-mumbai',
    description: 'Premium hotel with stunning views',
    location_city: 'Mumbai',
    location_state: 'Maharashtra',
    price_per_night: 12000,
    available_rooms: 5,
    total_rooms: 30,
    star_rating: 5,
    amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant'],
    is_featured: true,
    is_active: true,
    images: ['https://example.com/hotel2.jpg']
  }
];

const flights = [
  {
    id: 'flight-1',
    airline: 'Air India',
    flight_number: 'AI101',
    departure_city: 'Mumbai',
    arrival_city: 'Delhi',
    departure_time: '2024-12-15T08:00:00Z',
    arrival_time: '2024-12-15T10:30:00Z',
    price_economy: 5000,
    price_business: 15000,
    available_seats: 20,
    total_seats: 100,
    duration_minutes: 150,
    is_featured: true,
    is_active: true
  },
  {
    id: 'flight-2',
    airline: 'IndiGo',
    flight_number: '6E123',
    departure_city: 'Mumbai',
    arrival_city: 'Delhi',
    departure_time: '2024-12-15T14:00:00Z',
    arrival_time: '2024-12-15T16:30:00Z',
    price_economy: 4500,
    available_seats: 15,
    total_seats: 80,
    duration_minutes: 150,
    is_featured: false,
    is_active: true
  }
];

const booking = {
  id: 'booking-123',
  user_id: 'test-user-id',
  item_type: 'hotel',
  item_id: 'hotel-1',
  check_in_date: '2024-12-20',
  check_out_date: '2024-12-22',
  guests: 2,
  total_amount: 30000,
  status: 'confirmed',
  booking_reference: 'BK123456789',
  created_at: '2024-12-01T10:00:00Z'
};

const paymentOrder = {
  id: 'order-123',
  order_id: 'order_rzp_123',
  booking_id: 'booking-123',
  amount: 30000,
  currency: 'INR',
  status: 'created',
  created_at: '2024-12-01T10:00:00Z'
};

const itinerary = {
  id: 'itinerary-123',
  user_id: 'test-user-id',
  title: 'Mumbai Cultural Adventure',
  description: 'A 4-day cultural journey through Mumbai',
  destination: 'Mumbai, India',
  start_date: '2024-12-15T00:00:00Z',
  end_date: '2024-12-18T23:59:59Z',
  duration: 4,
  travelers: 2,
  budget_estimated_total: 25000,
  interests: ['culture', 'food', 'history'],
  travel_style: 'moderate',
  accommodation_type: 'mid_range',
  days: [
    {
      day: 1,
      date: '2024-12-15',
      title: 'Gateway to Mumbai',
      description: 'Arrival and exploration of iconic landmarks',
      activities: [
        {
          name: 'Gateway of India',
          description: 'Historic monument and popular meeting point',
          type: 'attraction',
          location: { name: 'Gateway of India', address: 'Apollo Bandar, Colaba, Mumbai' },
          duration: '2 hours',
          cost: 0,
          bookingRequired: false,
          bestTime: 'Morning',
          tips: ['Best for photography in early morning']
        }
      ],
      meals: [
        {
          name: 'Leopold Cafe',
          type: 'lunch',
          cuisine: 'Continental',
          location: { name: 'Leopold Cafe', address: 'Shahid Bhagat Singh Rd, Colaba, Mumbai' },
          cost: 800,
          specialties: ['Chicken Tikka', 'Butter Chicken'],
          bookingRequired: false,
          tips: ['Famous for its history']
        }
      ],
      estimatedCost: 2000,
      duration: 'Full day',
      highlights: ['Gateway of India', 'Colaba Causeway']
    }
  ],
  summary: {
    totalActivities: 8,
    totalMeals: 6,
    totalCost: 25000,
    highlights: ['Gateway of India', 'Mumbai Street Food Tour', 'Elephanta Caves'],
    tips: ['Use local trains for budget travel', 'Try street food but be cautious']
  },
  is_public: false,
  created_at: '2024-12-01T10:00:00Z'
};

module.exports = {
  hotels,
  flights,
  booking,
  paymentOrder,
  itinerary
};

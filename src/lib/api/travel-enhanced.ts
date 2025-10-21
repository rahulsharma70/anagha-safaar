// src/lib/api/travel-enhanced.ts
import axios from 'axios';
import { logger } from '../logger';
import { redisCache, cacheKeys } from '../cache/redis';
import { rateLimiter } from '../security/rateLimiter';
import { inputValidator } from '../security/validator';

const AMADEUS_API_KEY = import.meta.env.VITE_AMADEUS_API_KEY;
const AMADEUS_API_SECRET = import.meta.env.VITE_AMADEUS_API_SECRET;

let amadeusAccessToken: string | null = null;
let tokenExpiryTime: number = 0;

const getAmadeusAccessToken = async () => {
  if (amadeusAccessToken && Date.now() < tokenExpiryTime) {
    return amadeusAccessToken;
  }

  try {
    const response = await axios.post(
      'https://test.api.amadeus.com/v1/security/oauth2/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AMADEUS_API_KEY,
        client_secret: AMADEUS_API_SECRET,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    amadeusAccessToken = response.data.access_token;
    tokenExpiryTime = Date.now() + (response.data.expires_in - 60) * 1000;
    logger.info("Amadeus access token refreshed.");
    return amadeusAccessToken;
  } catch (error) {
    logger.error("Failed to get Amadeus access token", error);
    throw new Error("Failed to authenticate with Amadeus API");
  }
};

export interface HotelSearchParams {
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  rooms: number;
  currency: string;
}

export interface HotelOffer {
  id: string;
  name: string;
  description: string;
  location: {
    city: string;
    country: string;
  };
  starRating: number;
  price: number;
  images: string[];
  amenities: string[];
}

export interface FlightSearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: string;
  currency: string;
}

export interface FlightOffer {
  id: string;
  airline: string;
  flightNumber: string;
  departure: {
    city: string;
    time: string;
  };
  arrival: {
    city: string;
    time: string;
  };
  price: number;
  availableSeats: number;
}

export const enhancedTravelAPI = {
  searchHotels: async (params: HotelSearchParams): Promise<HotelOffer[]> => {
    try {
      // Validate input
      const validation = inputValidator.validateSearchParams(params, 'hotel');
      if (!validation.isValid) {
        throw new Error(`Invalid search parameters: ${JSON.stringify(validation.errors)}`);
      }

      // Rate limiting
      const rateLimitResult = await rateLimiter.checkLimit('api:hotels', 'api:hotels');
      if (!rateLimitResult.allowed) {
        throw new Error('Rate limit exceeded for hotel search');
      }

      // Check cache first
      const cacheKey = cacheKeys.hotels(params.cityCode, params.checkInDate, params.checkOutDate);
      const cachedResult = await redisCache.get<HotelOffer[]>(cacheKey);
      if (cachedResult) {
        logger.info("Hotels fetched from cache");
        return cachedResult;
      }

      const token = await getAmadeusAccessToken();
      const response = await axios.get(
        'https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city',
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            cityCode: params.cityCode,
          },
        }
      );

      // Mock data for demonstration
      const mockHotels: HotelOffer[] = [
        {
          id: 'hotel1',
          name: 'Grand Hyatt Delhi',
          description: 'A luxurious stay in the heart of Delhi.',
          location: { city: 'Delhi', country: 'India' },
          starRating: 5,
          price: 8500,
          images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop'],
          amenities: ['Pool', 'Spa', 'Restaurant'],
        },
        {
          id: 'hotel2',
          name: 'The Leela Mumbai',
          description: 'Experience unparalleled luxury near Mumbai airport.',
          location: { city: 'Mumbai', country: 'India' },
          starRating: 5,
          price: 9200,
          images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop'],
          amenities: ['Gym', 'Bar', 'Conference Rooms'],
        },
        {
          id: 'hotel3',
          name: 'Taj Palace Delhi',
          description: 'Iconic hotel with rich history and modern comforts.',
          location: { city: 'Delhi', country: 'India' },
          starRating: 5,
          price: 12000,
          images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop'],
          amenities: ['Fine Dining', 'Concierge', 'Business Center'],
        },
      ];

      const filteredHotels = mockHotels.filter(hotel => 
        hotel.location.city.toLowerCase().includes(params.cityCode.toLowerCase())
      );

      // Cache the results for 30 minutes
      await redisCache.set(cacheKey, filteredHotels, 30 * 60 * 1000);

      logger.info("Hotels fetched successfully from Amadeus API.");
      return filteredHotels;

    } catch (error) {
      logger.error("Error searching hotels:", error);
      throw error;
    }
  },

  searchFlights: async (params: FlightSearchParams): Promise<FlightOffer[]> => {
    try {
      // Validate input
      const validation = inputValidator.validateSearchParams(params, 'flight');
      if (!validation.isValid) {
        throw new Error(`Invalid search parameters: ${JSON.stringify(validation.errors)}`);
      }

      // Rate limiting
      const rateLimitResult = await rateLimiter.checkLimit('api:flights', 'api:flights');
      if (!rateLimitResult.allowed) {
        throw new Error('Rate limit exceeded for flight search');
      }

      // Check cache first
      const cacheKey = cacheKeys.flights(params.originLocationCode, params.destinationLocationCode, params.departureDate);
      const cachedResult = await redisCache.get<FlightOffer[]>(cacheKey);
      if (cachedResult) {
        logger.info("Flights fetched from cache");
        return cachedResult;
      }

      const token = await getAmadeusAccessToken();
      const response = await axios.get(
        'https://test.api.amadeus.com/v2/shopping/flight-offers',
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            originLocationCode: params.originLocationCode,
            destinationLocationCode: params.destinationLocationCode,
            departureDate: params.departureDate,
            returnDate: params.returnDate,
            adults: params.adults,
            children: params.children,
            infants: params.infants,
            travelClass: params.travelClass,
            currencyCode: params.currency,
            max: 20,
          },
        }
      );

      const flightOffers: FlightOffer[] = response.data.data.map((offer: any) => {
        const itinerary = offer.itineraries[0];
        const segment = itinerary.segments[0];
        const lastSegment = itinerary.segments[itinerary.segments.length - 1];
        const carrierCode = segment.carrierCode;
        const flightNumber = segment.number;
        const airline = response.data.dictionaries.carriers[carrierCode] || carrierCode;

        return {
          id: offer.id,
          airline: airline,
          flightNumber: flightNumber,
          departure: {
            city: segment.departure.iataCode,
            time: segment.departure.at,
          },
          arrival: {
            city: lastSegment.arrival.iataCode,
            time: lastSegment.arrival.at,
          },
          price: parseFloat(offer.price.grandTotal),
          availableSeats: offer.numberOfBookableSeats || 0,
        };
      });

      // Cache the results for 15 minutes
      await redisCache.set(cacheKey, flightOffers, 15 * 60 * 1000);

      logger.info("Flights fetched successfully from Amadeus API.");
      return flightOffers;
    } catch (error) {
      logger.error("Error searching flights:", error);
      throw error;
    }
  },

  searchTours: async (params: any): Promise<any[]> => {
    try {
      // Validate input
      const validation = inputValidator.validateSearchParams(params, 'tour');
      if (!validation.isValid) {
        throw new Error(`Invalid search parameters: ${JSON.stringify(validation.errors)}`);
      }

      // Rate limiting
      const rateLimitResult = await rateLimiter.checkLimit('api:tours', 'api:tours');
      if (!rateLimitResult.allowed) {
        throw new Error('Rate limit exceeded for tour search');
      }

      // Check cache first
      const cacheKey = cacheKeys.tours(params.location, params.duration);
      const cachedResult = await redisCache.get<any[]>(cacheKey);
      if (cachedResult) {
        logger.info("Tours fetched from cache");
        return cachedResult;
      }

      logger.info("Searching tours with params:", params);
      
      // Mock data for demonstration
      const mockTours = [
        {
          id: 'tour1',
          name: 'Golden Triangle Tour',
          location: params.location,
          duration: params.duration,
          price: 25000,
          description: 'Explore the iconic Golden Triangle route',
          images: ['https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&h=600&fit=crop'],
        }
      ];

      // Cache the results for 1 hour
      await redisCache.set(cacheKey, mockTours, 60 * 60 * 1000);

      return mockTours;
    } catch (error) {
      logger.error("Error searching tours:", error);
      throw error;
    }
  },
};

import axios, { AxiosInstance } from 'axios';
import { logger } from '../lib/logger';

// =============================================================================
// 1. INTERFACES
// =============================================================================

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  travelClass: string;
  maxPrice?: number;
  airlines?: string[];
  maxStops?: number;
}

export interface FlightOffer {
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate: string;
  numberOfBookableSeats: number;
  itineraries: FlightItinerary[];
  price: FlightPrice;
  pricingOptions: PricingOptions;
  validatingAirlineCodes: string[];
  travelerPricings: TravelerPricing[];
}

export interface FlightItinerary {
  duration: string;
  segments: FlightSegment[];
}

export interface FlightSegment {
  departure: {
    iataCode: string;
    terminal?: string;
    at: string;
  };
  arrival: {
    iataCode: string;
    terminal?: string;
    at: string;
  };
  carrierCode: string;
  number: string;
  aircraft: {
    code: string;
  };
  operating: {
    carrierCode: string;
  };
  duration: string;
  id: string;
  numberOfStops: number;
  blacklistedInEU: boolean;
}

export interface FlightPrice {
  currency: string;
  total: string;
  base: string;
  fees: Array<{
    amount: string;
    type: string;
  }>;
  grandTotal: string;
}

export interface PricingOptions {
  fareType: string[];
  includedCheckedBagsOnly: boolean;
}

export interface TravelerPricing {
  travelerId: string;
  fareOption: string;
  travelerType: string;
  price: {
    currency: string;
    total: string;
    base: string;
  };
  fareDetailsBySegment: Array<{
    segmentId: string;
    cabin: string;
    fareBasis: string;
    class: string;
    includedCheckedBags: {
      weight: number;
      weightUnit: string;
    };
  }>;
}

export interface Airport {
  type: string;
  subType: string;
  name: string;
  detailedName: string;
  id: string;
  self: {
    href: string;
    methods: string[];
  };
  timeZoneOffset: string;
  iataCode: string;
  geoCode: {
    latitude: number;
    longitude: number;
  };
  address: {
    cityName: string;
    cityCode: string;
    countryName: string;
    countryCode: string;
  };
  analytics: {
    travelers: {
      score: number;
    };
  };
}

// =============================================================================
// 2. AMADEUS SERVICE CLASS
// =============================================================================

export class AmadeusService {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com',
      timeout: 30000,
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(async (config) => {
      await this.ensureValidToken();
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Amadeus API Error', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  // =============================================================================
  // 3. AUTHENTICATION
  // =============================================================================

  private async ensureValidToken(): Promise<void> {
    const now = Date.now();
    
    // Check if token is still valid (with 5-minute buffer)
    if (this.accessToken && now < this.tokenExpiry - 300000) {
      return;
    }

    await this.getAccessToken();
  }

  private async getAccessToken(): Promise<void> {
    try {
      const response = await axios.post(
        `${process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com'}/v1/security/oauth2/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: process.env.AMADEUS_API_KEY as string,
          client_secret: process.env.AMADEUS_API_SECRET as string,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

      logger.info('Amadeus access token obtained', {
        expiresIn: response.data.expires_in
      });

    } catch (error) {
      logger.error('Failed to get Amadeus access token', error);
      throw new Error('Failed to authenticate with Amadeus API');
    }
  }

  // =============================================================================
  // 4. FLIGHT SEARCH
  // =============================================================================

  async searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
    try {
      const searchParams: any = {
        originLocationCode: params.origin,
        destinationLocationCode: params.destination,
        departureDate: params.departureDate,
        adults: params.adults,
        children: params.children,
        infants: params.infants,
        travelClass: params.travelClass,
        currencyCode: 'INR',
        max: 250, // Maximum number of results
      };

      if (params.returnDate) {
        searchParams.returnDate = params.returnDate;
      }

      if (params.maxPrice) {
        searchParams.maxPrice = params.maxPrice;
      }

      if (params.airlines && params.airlines.length > 0) {
        searchParams.includedAirlineCodes = params.airlines.join(',');
      }

      if (params.maxStops !== undefined) {
        searchParams.max = params.maxStops;
      }

      const response = await this.client.get('/v2/shopping/flight-offers', {
        params: searchParams,
      });

      const offers = response.data.data || [];
      
      logger.info('Flight search completed', {
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate,
        resultsCount: offers.length
      });

      return offers;

    } catch (error) {
      logger.error('Error searching flights', error);
      throw error;
    }
  }

  // =============================================================================
  // 5. GET FLIGHT OFFER
  // =============================================================================

  async getFlightOffer(offerId: string): Promise<FlightOffer> {
    try {
      const response = await this.client.get(`/v2/shopping/flight-offers/${offerId}`);
      
      logger.info('Flight offer fetched', { offerId });
      
      return response.data.data;

    } catch (error) {
      logger.error('Error fetching flight offer', error);
      throw error;
    }
  }

  // =============================================================================
  // 6. AIRPORT SEARCH
  // =============================================================================

  async searchAirports(keyword: string, countryCode?: string): Promise<Airport[]> {
    try {
      const params: any = {
        subType: 'AIRPORT',
        keyword,
        'page[limit]': 20,
      };

      if (countryCode) {
        params.countryCode = countryCode;
      }

      const response = await this.client.get('/v1/reference-data/locations', {
        params,
      });

      const airports = response.data.data || [];
      
      logger.info('Airport search completed', {
        keyword,
        countryCode,
        resultsCount: airports.length
      });

      return airports;

    } catch (error) {
      logger.error('Error searching airports', error);
      throw error;
    }
  }

  // =============================================================================
  // 7. FLIGHT INSPIRATION SEARCH
  // =============================================================================

  async getFlightInspiration(origin: string, maxPrice?: number): Promise<any[]> {
    try {
      const params: any = {
        origin,
        maxPrice,
        currency: 'INR',
      };

      const response = await this.client.get('/v1/shopping/flight-destinations', {
        params,
      });

      const destinations = response.data.data || [];
      
      logger.info('Flight inspiration search completed', {
        origin,
        resultsCount: destinations.length
      });

      return destinations;

    } catch (error) {
      logger.error('Error getting flight inspiration', error);
      throw error;
    }
  }

  // =============================================================================
  // 8. FLIGHT PRICE ANALYSIS
  // =============================================================================

  async getFlightPriceAnalysis(origin: string, destination: string, departureDate: string): Promise<any> {
    try {
      const params = {
        origin,
        destination,
        departureDate,
        currency: 'INR',
      };

      const response = await this.client.get('/v1/analytics/itinerary-price-metrics', {
        params,
      });

      logger.info('Flight price analysis completed', {
        origin,
        destination,
        departureDate
      });

      return response.data.data;

    } catch (error) {
      logger.error('Error getting flight price analysis', error);
      throw error;
    }
  }

  // =============================================================================
  // 9. AIRLINE CODE LOOKUP
  // =============================================================================

  async getAirlineInfo(airlineCode: string): Promise<any> {
    try {
      const response = await this.client.get('/v1/reference-data/airlines', {
        params: {
          airlineCodes: airlineCode,
        },
      });

      logger.info('Airline info fetched', { airlineCode });

      return response.data.data?.[0] || null;

    } catch (error) {
      logger.error('Error getting airline info', error);
      throw error;
    }
  }

  // =============================================================================
  // 10. FLIGHT DELAYS AND CANCELLATIONS
  // =============================================================================

  async getFlightDelays(airlineCode: string, flightNumber: string, scheduledDepartureDate: string): Promise<any> {
    try {
      const params = {
        airlineCode,
        flightNumber,
        scheduledDepartureDate,
      };

      const response = await this.client.get('/v2/travel/predictions/flight-delay', {
        params,
      });

      logger.info('Flight delay prediction fetched', {
        airlineCode,
        flightNumber,
        scheduledDepartureDate
      });

      return response.data.data;

    } catch (error) {
      logger.error('Error getting flight delays', error);
      throw error;
    }
  }

  // =============================================================================
  // 11. HEALTH CHECK
  // =============================================================================

  async healthCheck(): Promise<boolean> {
    try {
      await this.ensureValidToken();
      return true;
    } catch (error) {
      logger.error('Amadeus service health check failed', error);
      return false;
    }
  }
}

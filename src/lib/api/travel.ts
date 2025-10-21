import axios from 'axios';

// Types for API responses
export interface HotelSearchParams {
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  rooms: number;
  currency?: string;
}

export interface HotelOffer {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  rating: number;
  images: string[];
  amenities: string[];
  location: {
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  availableRooms: number;
  starRating: number;
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
  currency?: string;
}

export interface FlightOffer {
  id: string;
  airline: string;
  flightNumber: string;
  departure: {
    city: string;
    airport: string;
    time: string;
    date: string;
  };
  arrival: {
    city: string;
    airport: string;
    time: string;
    date: string;
  };
  price: number;
  currency: string;
  availableSeats: number;
  travelClass: string;
  duration: string;
}

export interface TourSearchParams {
  destination: string;
  startDate: string;
  endDate: string;
  adults: number;
  children?: number;
  budget?: number;
  tourType?: string;
}

export interface TourOffer {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  difficulty: string;
  tourType: string;
  images: string[];
  itinerary: string[];
  inclusions: string[];
  exclusions: string[];
  location: {
    city: string;
    state: string;
    country: string;
  };
  maxGroupSize: number;
}

class AmadeusAPI {
  private baseURL = 'https://api.amadeus.com/v1';
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(`${this.baseURL}/security/oauth2/token`, 
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: import.meta.env.VITE_AMADEUS_API_KEY,
          client_secret: import.meta.env.VITE_AMADEUS_API_SECRET,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer
      
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Amadeus access token:', error);
      throw new Error('Failed to authenticate with Amadeus API');
    }
  }

  async searchHotels(params: HotelSearchParams): Promise<HotelOffer[]> {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(`${this.baseURL}/shopping/hotel-offers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          cityCode: params.cityCode,
          checkInDate: params.checkInDate,
          checkOutDate: params.checkOutDate,
          adults: params.adults,
          rooms: params.rooms,
          currency: params.currency || 'INR',
          view: 'FULL',
        },
      });

      return this.transformHotelOffers(response.data.data);
    } catch (error) {
      console.error('Amadeus hotel search error:', error);
      throw new Error('Failed to search hotels');
    }
  }

  async searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(`${this.baseURL}/shopping/flight-offers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          originLocationCode: params.originLocationCode,
          destinationLocationCode: params.destinationLocationCode,
          departureDate: params.departureDate,
          returnDate: params.returnDate,
          adults: params.adults,
          children: params.children,
          infants: params.infants,
          travelClass: params.travelClass || 'ECONOMY',
          currencyCode: params.currency || 'INR',
          max: 20,
        },
      });

      return this.transformFlightOffers(response.data.data);
    } catch (error) {
      console.error('Amadeus flight search error:', error);
      throw new Error('Failed to search flights');
    }
  }

  private transformHotelOffers(data: any[]): HotelOffer[] {
    return data.map((offer: any) => ({
      id: offer.hotel.hotelId,
      name: offer.hotel.name,
      description: offer.hotel.description?.text || '',
      price: offer.offers[0]?.price?.total || 0,
      currency: offer.offers[0]?.price?.currency || 'INR',
      rating: offer.hotel.rating || 4.0,
      images: offer.hotel.media?.map((media: any) => media.uri) || [],
      amenities: offer.hotel.amenities || [],
      location: {
        city: offer.hotel.address?.cityName || '',
        state: offer.hotel.address?.stateCode || '',
        country: offer.hotel.address?.countryCode || '',
        latitude: offer.hotel.geoCode?.latitude || 0,
        longitude: offer.hotel.geoCode?.longitude || 0,
      },
      availableRooms: offer.offers[0]?.room?.numberOfRooms || 1,
      starRating: offer.hotel.rating || 4,
    }));
  }

  private transformFlightOffers(data: any[]): FlightOffer[] {
    return data.map((offer: any) => {
      const itinerary = offer.itineraries[0];
      const segments = itinerary.segments;
      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1];

      return {
        id: offer.id,
        airline: firstSegment.carrierCode,
        flightNumber: firstSegment.number,
        departure: {
          city: firstSegment.departure.iataCode,
          airport: firstSegment.departure.iataCode,
          time: firstSegment.departure.at,
          date: firstSegment.departure.at.split('T')[0],
        },
        arrival: {
          city: lastSegment.arrival.iataCode,
          airport: lastSegment.arrival.iataCode,
          time: lastSegment.arrival.at,
          date: lastSegment.arrival.at.split('T')[0],
        },
        price: parseFloat(offer.price.total),
        currency: offer.price.currency,
        availableSeats: offer.numberOfBookableSeats || 9,
        travelClass: offer.travelerPricings[0]?.fareDetailsBySegment[0]?.cabin || 'ECONOMY',
        duration: itinerary.duration,
      };
    });
  }
}

class RateHawkAPI {
  private baseURL = 'https://api.ratehawk.com/v1';
  private apiKey = import.meta.env.VITE_RATEHAWK_API_KEY;

  async searchHotels(params: HotelSearchParams): Promise<HotelOffer[]> {
    try {
      const response = await axios.post(`${this.baseURL}/hotels/search`, {
        city: params.cityCode,
        checkIn: params.checkInDate,
        checkOut: params.checkOutDate,
        adults: params.adults,
        rooms: params.rooms,
        currency: params.currency || 'INR',
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return this.transformRateHawkHotels(response.data.hotels);
    } catch (error) {
      console.error('RateHawk hotel search error:', error);
      throw new Error('Failed to search hotels via RateHawk');
    }
  }

  private transformRateHawkHotels(hotels: any[]): HotelOffer[] {
    return hotels.map((hotel: any) => ({
      id: hotel.id,
      name: hotel.name,
      description: hotel.description || '',
      price: hotel.price || 0,
      currency: hotel.currency || 'INR',
      rating: hotel.rating || 4.0,
      images: hotel.images || [],
      amenities: hotel.amenities || [],
      location: {
        city: hotel.city || '',
        state: hotel.state || '',
        country: hotel.country || '',
        latitude: hotel.latitude || 0,
        longitude: hotel.longitude || 0,
      },
      availableRooms: hotel.availableRooms || 1,
      starRating: hotel.starRating || 4,
    }));
  }
}

class TBOAPI {
  private baseURL = 'https://api.tbo.com/v1';
  private username = import.meta.env.VITE_TBO_USERNAME;
  private password = import.meta.env.VITE_TBO_PASSWORD;
  private apiKey = import.meta.env.VITE_TBO_API_KEY;

  async searchTours(params: TourSearchParams): Promise<TourOffer[]> {
    try {
      const response = await axios.post(`${this.baseURL}/tours/search`, {
        destination: params.destination,
        startDate: params.startDate,
        endDate: params.endDate,
        adults: params.adults,
        children: params.children,
        budget: params.budget,
        tourType: params.tourType,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return this.transformTBOTours(response.data.tours);
    } catch (error) {
      console.error('TBO tour search error:', error);
      throw new Error('Failed to search tours via TBO');
    }
  }

  private transformTBOTours(tours: any[]): TourOffer[] {
    return tours.map((tour: any) => ({
      id: tour.id,
      name: tour.name,
      description: tour.description || '',
      price: tour.price || 0,
      currency: tour.currency || 'INR',
      duration: tour.duration || 1,
      difficulty: tour.difficulty || 'Easy',
      tourType: tour.tourType || 'Cultural',
      images: tour.images || [],
      itinerary: tour.itinerary || [],
      inclusions: tour.inclusions || [],
      exclusions: tour.exclusions || [],
      location: {
        city: tour.city || '',
        state: tour.state || '',
        country: tour.country || '',
      },
      maxGroupSize: tour.maxGroupSize || 20,
    }));
  }
}

// Export API instances
export const amadeusAPI = new AmadeusAPI();
export const rateHawkAPI = new RateHawkAPI();
export const tboAPI = new TBOAPI();

// Main API service that combines all providers
export class TravelAPI {
  async searchHotels(params: HotelSearchParams): Promise<HotelOffer[]> {
    try {
      // Try Amadeus first, fallback to RateHawk
      const amadeusResults = await amadeusAPI.searchHotels(params);
      if (amadeusResults.length > 0) {
        return amadeusResults;
      }
      
      return await rateHawkAPI.searchHotels(params);
    } catch (error) {
      console.error('All hotel search providers failed:', error);
      throw new Error('Hotel search is currently unavailable');
    }
  }

  async searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
    try {
      return await amadeusAPI.searchFlights(params);
    } catch (error) {
      console.error('Flight search failed:', error);
      throw new Error('Flight search is currently unavailable');
    }
  }

  async searchTours(params: TourSearchParams): Promise<TourOffer[]> {
    try {
      return await tboAPI.searchTours(params);
    } catch (error) {
      console.error('Tour search failed:', error);
      throw new Error('Tour search is currently unavailable');
    }
  }
}

export const travelAPI = new TravelAPI();

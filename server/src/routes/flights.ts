import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../app';
import { logger } from '../lib/logger';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/asyncHandler';
import { AmadeusService } from '../services/amadeusService';
import { RedisService } from '../services/redisService';

const router = Router();

// =============================================================================
// 1. VALIDATION SCHEMAS
// =============================================================================

const flightSearchSchema = z.object({
  // Search parameters
  origin: z.string().min(3, 'Origin airport code is required'),
  destination: z.string().min(3, 'Destination airport code is required'),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  adults: z.string().optional().transform(val => val ? parseInt(val) : 1),
  children: z.string().optional().transform(val => val ? parseInt(val) : 0),
  infants: z.string().optional().transform(val => val ? parseInt(val) : 0),
  travelClass: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']).optional().default('ECONOMY'),
  
  // Pagination
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  
  // Filters
  maxPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  airlines: z.string().optional().transform(val => val ? val.split(',') : undefined),
  maxStops: z.string().optional().transform(val => val ? parseInt(val) : undefined),
});

const flightCreateSchema = z.object({
  airline: z.string().min(1, 'Airline is required'),
  flight_number: z.string().min(1, 'Flight number is required'),
  departure_city: z.string().min(1, 'Departure city is required'),
  arrival_city: z.string().min(1, 'Arrival city is required'),
  departure_time: z.string().datetime('Invalid departure time'),
  arrival_time: z.string().datetime('Invalid arrival time'),
  price_economy: z.number().min(0, 'Economy price must be positive'),
  price_business: z.number().min(0).optional(),
  available_seats: z.number().min(0).default(0),
  is_featured: z.boolean().default(false),
});

const flightUpdateSchema = flightCreateSchema.partial();

// =============================================================================
// 2. SEARCH FLIGHTS WITH AMADEUS API
// =============================================================================

router.get('/search',
  validateRequest({ query: flightSearchSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      adults = 1,
      children = 0,
      infants = 0,
      travelClass = 'ECONOMY',
      page = 1,
      limit = 10,
      maxPrice,
      airlines,
      maxStops
    } = req.query as any;

    try {
      // Create cache key
      const cacheKey = `flights:${origin}:${destination}:${departureDate}:${returnDate || 'oneway'}:${adults}:${children}:${infants}:${travelClass}:${page}:${limit}`;
      
      // Try to get from cache first
      const cachedResults = await RedisService.get(cacheKey);
      if (cachedResults) {
        logger.info('Flight search results served from cache', { cacheKey });
        return res.json({
          success: true,
          data: cachedResults,
          cached: true,
          searchParams: req.query
        });
      }

      // Search flights using Amadeus API
      const amadeusService = new AmadeusService();
      const searchParams = {
        origin,
        destination,
        departureDate,
        returnDate,
        adults,
        children,
        infants,
        travelClass,
        maxPrice,
        airlines,
        maxStops
      };

      const flights = await amadeusService.searchFlights(searchParams);

      // Cache results for 15 minutes
      await RedisService.setex(cacheKey, 900, flights);

      // Calculate pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedFlights = flights.slice(startIndex, endIndex);

      logger.info('Flight search completed', {
        origin,
        destination,
        departureDate,
        resultsCount: flights.length,
        paginatedCount: paginatedFlights.length
      });

      res.json({
        success: true,
        data: paginatedFlights,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(flights.length / limit),
          totalCount: flights.length,
          limit,
          hasNextPage: endIndex < flights.length,
          hasPrevPage: page > 1
        },
        searchParams: req.query,
        cached: false
      });

    } catch (error) {
      logger.error('Error in flight search', error);
      throw error;
    }
  })
);

// =============================================================================
// 3. GET FLIGHT OFFERS (Amadeus API)
// =============================================================================

router.get('/offers/:offerId',
  asyncHandler(async (req: Request, res: Response) => {
    const { offerId } = req.params;

    try {
      // Check cache first
      const cacheKey = `flight_offer:${offerId}`;
      const cachedOffer = await RedisService.get(cacheKey);
      
      if (cachedOffer) {
        logger.info('Flight offer served from cache', { offerId });
        return res.json({
          success: true,
          data: cachedOffer,
          cached: true
        });
      }

      // Get offer from Amadeus API
      const amadeusService = new AmadeusService();
      const offer = await amadeusService.getFlightOffer(offerId);

      // Cache for 30 minutes
      await RedisService.setex(cacheKey, 1800, offer);

      logger.info('Flight offer fetched', { offerId });

      res.json({
        success: true,
        data: offer,
        cached: false
      });

    } catch (error) {
      logger.error('Error fetching flight offer', error);
      throw error;
    }
  })
);

// =============================================================================
// 4. GET AIRPORTS (Amadeus API)
// =============================================================================

router.get('/airports',
  asyncHandler(async (req: Request, res: Response) => {
    const { keyword, countryCode } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: 'Keyword is required for airport search',
        code: 'MISSING_KEYWORD'
      });
    }

    try {
      // Check cache first
      const cacheKey = `airports:${keyword}:${countryCode || 'all'}`;
      const cachedAirports = await RedisService.get(cacheKey);
      
      if (cachedAirports) {
        logger.info('Airports served from cache', { keyword });
        return res.json({
          success: true,
          data: cachedAirports,
          cached: true
        });
      }

      // Search airports using Amadeus API
      const amadeusService = new AmadeusService();
      const airports = await amadeusService.searchAirports(keyword as string, countryCode as string);

      // Cache for 1 hour
      await RedisService.setex(cacheKey, 3600, airports);

      logger.info('Airports search completed', { 
        keyword, 
        resultsCount: airports.length 
      });

      res.json({
        success: true,
        data: airports,
        cached: false
      });

    } catch (error) {
      logger.error('Error searching airports', error);
      throw error;
    }
  })
);

// =============================================================================
// 5. GET FLIGHTS FROM DATABASE
// =============================================================================

router.get('/',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      airline,
      departure_city,
      arrival_city,
      minPrice,
      maxPrice,
      sortBy = 'departure_time',
      sortOrder = 'asc'
    } = req.query as any;

    try {
      // Build query
      let query = supabase
        .from('flights')
        .select('*', { count: 'exact' });

      // Apply filters
      if (airline) {
        query = query.ilike('airline', `%${airline}%`);
      }
      
      if (departure_city) {
        query = query.ilike('departure_city', `%${departure_city}%`);
      }
      
      if (arrival_city) {
        query = query.ilike('arrival_city', `%${arrival_city}%`);
      }
      
      if (minPrice !== undefined) {
        query = query.gte('price_economy', minPrice);
      }
      
      if (maxPrice !== undefined) {
        query = query.lte('price_economy', maxPrice);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data: flights, error, count } = await query;

      if (error) {
        logger.error('Error fetching flights from database', error);
        throw error;
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil((count || 0) / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      logger.info('Flights fetched from database', {
        count: flights?.length || 0,
        totalCount: count || 0,
        page,
        limit
      });

      res.json({
        success: true,
        data: flights || [],
        pagination: {
          currentPage: page,
          totalPages,
          totalCount: count || 0,
          limit,
          hasNextPage,
          hasPrevPage
        }
      });

    } catch (error) {
      logger.error('Error in flights GET endpoint', error);
      throw error;
    }
  })
);

// =============================================================================
// 6. GET FLIGHT BY ID
// =============================================================================

router.get('/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const { data: flight, error } = await supabase
        .from('flights')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Flight not found',
            code: 'FLIGHT_NOT_FOUND'
          });
        }
        throw error;
      }

      logger.info('Flight fetched by ID', { flightId: id });

      res.json({
        success: true,
        data: flight
      });

    } catch (error) {
      logger.error('Error fetching flight by ID', error);
      throw error;
    }
  })
);

// =============================================================================
// 7. CREATE FLIGHT (Admin only)
// =============================================================================

router.post('/',
  validateRequest({ body: flightCreateSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const flightData = req.body;

    try {
      const { data: flight, error } = await supabase
        .from('flights')
        .insert([flightData])
        .select()
        .single();

      if (error) {
        logger.error('Error creating flight', error);
        throw error;
      }

      logger.info('Flight created successfully', { flightId: flight.id });

      res.status(201).json({
        success: true,
        data: flight,
        message: 'Flight created successfully'
      });

    } catch (error) {
      logger.error('Error in flight creation', error);
      throw error;
    }
  })
);

// =============================================================================
// 8. UPDATE FLIGHT (Admin only)
// =============================================================================

router.put('/:id',
  validateRequest({ body: flightUpdateSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
      // Check if flight exists
      const { data: existingFlight } = await supabase
        .from('flights')
        .select('id')
        .eq('id', id)
        .single();

      if (!existingFlight) {
        return res.status(404).json({
          success: false,
          error: 'Flight not found',
          code: 'FLIGHT_NOT_FOUND'
        });
      }

      const { data: flight, error } = await supabase
        .from('flights')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating flight', error);
        throw error;
      }

      logger.info('Flight updated successfully', { flightId: id });

      res.json({
        success: true,
        data: flight,
        message: 'Flight updated successfully'
      });

    } catch (error) {
      logger.error('Error in flight update', error);
      throw error;
    }
  })
);

// =============================================================================
// 9. DELETE FLIGHT (Admin only)
// =============================================================================

router.delete('/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      // Check if flight exists
      const { data: existingFlight } = await supabase
        .from('flights')
        .select('id')
        .eq('id', id)
        .single();

      if (!existingFlight) {
        return res.status(404).json({
          success: false,
          error: 'Flight not found',
          code: 'FLIGHT_NOT_FOUND'
        });
      }

      // Check for existing bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('item_type', 'flight')
        .eq('item_id', id)
        .limit(1);

      if (bookings && bookings.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Cannot delete flight with existing bookings',
          code: 'FLIGHT_HAS_BOOKINGS'
        });
      }

      const { error } = await supabase
        .from('flights')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Error deleting flight', error);
        throw error;
      }

      logger.info('Flight deleted successfully', { flightId: id });

      res.json({
        success: true,
        message: 'Flight deleted successfully'
      });

    } catch (error) {
      logger.error('Error in flight deletion', error);
      throw error;
    }
  })
);

// =============================================================================
// 10. GET FEATURED FLIGHTS
// =============================================================================

router.get('/featured/list',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 6;

    try {
      const { data: flights, error } = await supabase
        .from('flights')
        .select('*')
        .eq('is_featured', true)
        .gt('available_seats', 0)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching featured flights', error);
        throw error;
      }

      logger.info('Featured flights fetched', { count: flights?.length || 0 });

      res.json({
        success: true,
        data: flights || []
      });

    } catch (error) {
      logger.error('Error in featured flights endpoint', error);
      throw error;
    }
  })
);

// =============================================================================
// 11. GET FLIGHT PRICE HISTORY
// =============================================================================

router.get('/:id/price-history',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    try {
      // This would typically come from a price tracking service
      // For now, we'll return mock data
      const priceHistory = Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price_economy: Math.floor(Math.random() * 5000) + 2000,
        price_business: Math.floor(Math.random() * 10000) + 5000,
      }));

      logger.info('Flight price history fetched', { flightId: id, days });

      res.json({
        success: true,
        data: priceHistory
      });

    } catch (error) {
      logger.error('Error fetching flight price history', error);
      throw error;
    }
  })
);

export default router;

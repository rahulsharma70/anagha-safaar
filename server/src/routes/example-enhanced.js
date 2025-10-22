// Example route implementation with comprehensive error handling and logging
const express = require('express');
const router = express.Router();
const {
  asyncHandler,
  dbOperation,
  apiCall,
  validateRequired,
  sendError,
  sendSuccess,
  createPagination,
  ValidationError,
  NotFoundError,
  DatabaseError
} = require('../lib/errorHandlers');
const logger = require('../lib/logger');

// Example: Get hotels with comprehensive error handling
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, city, min_price, max_price, featured } = req.query;
  const requestId = req.requestId;
  
  try {
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      throw new ValidationError('Invalid pagination parameters');
    }
    
    // Build query
    let query = req.app.locals.supabase
      .from('hotels')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (city) {
      query = query.ilike('location_city', `%${city}%`);
    }
    
    if (min_price) {
      query = query.gte('price_per_night', min_price);
    }
    
    if (max_price) {
      query = query.lte('price_per_night', max_price);
    }
    
    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }
    
    // Apply pagination
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);
    
    // Execute database operation with logging
    const { data: hotels, error, count } = await dbOperation(
      'SELECT',
      'hotels',
      () => query,
      {
        requestId,
        filters: { city, min_price, max_price, featured },
        pagination: { page, limit }
      }
    );
    
    if (error) {
      throw new DatabaseError(`Failed to fetch hotels: ${error.message}`);
    }
    
    // Log business event
    logger.business('hotels_fetched', {
      requestId,
      count: hotels.length,
      totalCount: count,
      filters: { city, min_price, max_price, featured },
      userId: req.user?.id || null
    });
    
    // Send success response
    sendSuccess(res, {
      hotels,
      pagination: createPagination(page, limit, count)
    }, 'Hotels fetched successfully');
    
  } catch (error) {
    // Error will be handled by asyncHandler and sent to global error handler
    throw error;
  }
}));

// Example: Create hotel with validation and error handling
router.post('/', asyncHandler(async (req, res) => {
  const requestId = req.requestId;
  const hotelData = req.body;
  
  try {
    // Validate required fields
    validateRequired(hotelData, [
      'name',
      'location_city',
      'location_state',
      'price_per_night',
      'total_rooms'
    ]);
    
    // Validate data types and ranges
    if (hotelData.price_per_night < 0) {
      throw new ValidationError('Price per night must be positive', 'price_per_night');
    }
    
    if (hotelData.total_rooms < 1) {
      throw new ValidationError('Total rooms must be at least 1', 'total_rooms');
    }
    
    // Check if hotel with same slug already exists
    const { data: existingHotel } = await dbOperation(
      'SELECT',
      'hotels',
      () => req.app.locals.supabase
        .from('hotels')
        .select('id')
        .eq('slug', hotelData.slug)
        .single(),
      { requestId, slug: hotelData.slug }
    );
    
    if (existingHotel) {
      throw new ValidationError('Hotel with this slug already exists', 'slug');
    }
    
    // Create hotel
    const { data: newHotel, error } = await dbOperation(
      'INSERT',
      'hotels',
      () => req.app.locals.supabase
        .from('hotels')
        .insert({
          ...hotelData,
          available_rooms: hotelData.total_rooms,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single(),
      { requestId, hotelName: hotelData.name }
    );
    
    if (error) {
      throw new DatabaseError(`Failed to create hotel: ${error.message}`);
    }
    
    // Log business event
    logger.business('hotel_created', {
      requestId,
      hotelId: newHotel.id,
      hotelName: newHotel.name,
      userId: req.user?.id || null
    });
    
    // Send success response
    sendSuccess(res, newHotel, 'Hotel created successfully', 201);
    
  } catch (error) {
    throw error;
  }
}));

// Example: Get hotel by ID with error handling
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const requestId = req.requestId;
  
  try {
    // Validate ID format (assuming UUID)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      throw new ValidationError('Invalid hotel ID format');
    }
    
    // Fetch hotel
    const { data: hotel, error } = await dbOperation(
      'SELECT',
      'hotels',
      () => req.app.locals.supabase
        .from('hotels')
        .select('*')
        .eq('id', id)
        .single(),
      { requestId, hotelId: id }
    );
    
    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Hotel');
      }
      throw new DatabaseError(`Failed to fetch hotel: ${error.message}`);
    }
    
    // Log business event
    logger.business('hotel_viewed', {
      requestId,
      hotelId: id,
      hotelName: hotel.name,
      userId: req.user?.id || null
    });
    
    // Send success response
    sendSuccess(res, hotel, 'Hotel fetched successfully');
    
  } catch (error) {
    throw error;
  }
}));

// Example: External API call with error handling
router.get('/:id/weather', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const requestId = req.requestId;
  
  try {
    // First get hotel location
    const { data: hotel, error: hotelError } = await dbOperation(
      'SELECT',
      'hotels',
      () => req.app.locals.supabase
        .from('hotels')
        .select('location_city, location_state')
        .eq('id', id)
        .single(),
      { requestId, hotelId: id }
    );
    
    if (hotelError) {
      if (hotelError.code === 'PGRST116') {
        throw new NotFoundError('Hotel');
      }
      throw new DatabaseError(`Failed to fetch hotel: ${hotelError.message}`);
    }
    
    // Call external weather API
    const weatherData = await apiCall(
      'weather-api',
      'GET',
      `https://api.weather.com/v1/current?city=${hotel.location_city}`,
      async () => {
        const axios = require('axios');
        const response = await axios.get(
          `https://api.weather.com/v1/current?city=${hotel.location_city}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.WEATHER_API_KEY}`
            },
            timeout: 5000
          }
        );
        return response.data;
      },
      { requestId, hotelId: id, city: hotel.location_city }
    );
    
    // Log business event
    logger.business('weather_fetched', {
      requestId,
      hotelId: id,
      city: hotel.location_city,
      userId: req.user?.id || null
    });
    
    // Send success response
    sendSuccess(res, weatherData, 'Weather data fetched successfully');
    
  } catch (error) {
    throw error;
  }
}));

module.exports = router;

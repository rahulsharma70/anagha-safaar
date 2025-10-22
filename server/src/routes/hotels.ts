import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../app';
import { logger } from '../lib/logger';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// =============================================================================
// 1. VALIDATION SCHEMAS
// =============================================================================

const hotelSearchSchema = z.object({
  // Pagination
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  
  // Search filters
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  minPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  starRating: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  amenities: z.string().optional().transform(val => val ? val.split(',') : undefined),
  
  // Sorting
  sortBy: z.enum(['price', 'rating', 'name', 'created_at']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  
  // Features
  isFeatured: z.string().optional().transform(val => val === 'true'),
  availableRooms: z.string().optional().transform(val => val === 'true'),
});

const hotelCreateSchema = z.object({
  name: z.string().min(1, 'Hotel name is required'),
  slug: z.string().min(1, 'Hotel slug is required'),
  description: z.string().optional(),
  location_city: z.string().min(1, 'City is required'),
  location_state: z.string().min(1, 'State is required'),
  location_country: z.string().default('India'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  star_rating: z.number().min(1).max(5).optional(),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  price_per_night: z.number().min(0, 'Price must be positive'),
  available_rooms: z.number().min(0).default(0),
  is_featured: z.boolean().default(false),
});

const hotelUpdateSchema = hotelCreateSchema.partial();

// =============================================================================
// 2. GET HOTELS WITH PAGINATION AND FILTERS
// =============================================================================

router.get('/', 
  validateRequest({ query: hotelSearchSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      city,
      state,
      country,
      minPrice,
      maxPrice,
      starRating,
      amenities,
      sortBy = 'created_at',
      sortOrder = 'desc',
      isFeatured,
      availableRooms
    } = req.query as any;

    try {
      // Build query
      let query = supabase
        .from('hotels')
        .select('*', { count: 'exact' });

      // Apply filters
      if (city) {
        query = query.ilike('location_city', `%${city}%`);
      }
      
      if (state) {
        query = query.ilike('location_state', `%${state}%`);
      }
      
      if (country) {
        query = query.eq('location_country', country);
      }
      
      if (minPrice !== undefined) {
        query = query.gte('price_per_night', minPrice);
      }
      
      if (maxPrice !== undefined) {
        query = query.lte('price_per_night', maxPrice);
      }
      
      if (starRating !== undefined) {
        query = query.eq('star_rating', starRating);
      }
      
      if (amenities && amenities.length > 0) {
        // Filter hotels that contain any of the specified amenities
        query = query.contains('amenities', amenities);
      }
      
      if (isFeatured !== undefined) {
        query = query.eq('is_featured', isFeatured);
      }
      
      if (availableRooms) {
        query = query.gt('available_rooms', 0);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data: hotels, error, count } = await query;

      if (error) {
        logger.error('Error fetching hotels', error);
        throw error;
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil((count || 0) / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      logger.info('Hotels fetched successfully', {
        count: hotels?.length || 0,
        totalCount: count || 0,
        page,
        limit,
        filters: req.query
      });

      res.json({
        success: true,
        data: hotels || [],
        pagination: {
          currentPage: page,
          totalPages,
          totalCount: count || 0,
          limit,
          hasNextPage,
          hasPrevPage
        },
        filters: req.query
      });

    } catch (error) {
      logger.error('Error in hotels GET endpoint', error);
      throw error;
    }
  })
);

// =============================================================================
// 3. GET HOTEL BY ID
// =============================================================================

router.get('/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const { data: hotel, error } = await supabase
        .from('hotels')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Hotel not found',
            code: 'HOTEL_NOT_FOUND'
          });
        }
        throw error;
      }

      logger.info('Hotel fetched by ID', { hotelId: id });

      res.json({
        success: true,
        data: hotel
      });

    } catch (error) {
      logger.error('Error fetching hotel by ID', error);
      throw error;
    }
  })
);

// =============================================================================
// 4. GET HOTEL BY SLUG
// =============================================================================

router.get('/slug/:slug',
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;

    try {
      const { data: hotel, error } = await supabase
        .from('hotels')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Hotel not found',
            code: 'HOTEL_NOT_FOUND'
          });
        }
        throw error;
      }

      logger.info('Hotel fetched by slug', { slug });

      res.json({
        success: true,
        data: hotel
      });

    } catch (error) {
      logger.error('Error fetching hotel by slug', error);
      throw error;
    }
  })
);

// =============================================================================
// 5. CREATE HOTEL (Admin only)
// =============================================================================

router.post('/',
  validateRequest({ body: hotelCreateSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const hotelData = req.body;

    try {
      // Check if slug already exists
      const { data: existingHotel } = await supabase
        .from('hotels')
        .select('id')
        .eq('slug', hotelData.slug)
        .single();

      if (existingHotel) {
        return res.status(409).json({
          success: false,
          error: 'Hotel with this slug already exists',
          code: 'HOTEL_SLUG_EXISTS'
        });
      }

      const { data: hotel, error } = await supabase
        .from('hotels')
        .insert([hotelData])
        .select()
        .single();

      if (error) {
        logger.error('Error creating hotel', error);
        throw error;
      }

      logger.info('Hotel created successfully', { hotelId: hotel.id });

      res.status(201).json({
        success: true,
        data: hotel,
        message: 'Hotel created successfully'
      });

    } catch (error) {
      logger.error('Error in hotel creation', error);
      throw error;
    }
  })
);

// =============================================================================
// 6. UPDATE HOTEL (Admin only)
// =============================================================================

router.put('/:id',
  validateRequest({ body: hotelUpdateSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
      // Check if hotel exists
      const { data: existingHotel } = await supabase
        .from('hotels')
        .select('id')
        .eq('id', id)
        .single();

      if (!existingHotel) {
        return res.status(404).json({
          success: false,
          error: 'Hotel not found',
          code: 'HOTEL_NOT_FOUND'
        });
      }

      // If slug is being updated, check for conflicts
      if (updateData.slug) {
        const { data: slugConflict } = await supabase
          .from('hotels')
          .select('id')
          .eq('slug', updateData.slug)
          .neq('id', id)
          .single();

        if (slugConflict) {
          return res.status(409).json({
            success: false,
            error: 'Hotel with this slug already exists',
            code: 'HOTEL_SLUG_EXISTS'
          });
        }
      }

      const { data: hotel, error } = await supabase
        .from('hotels')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating hotel', error);
        throw error;
      }

      logger.info('Hotel updated successfully', { hotelId: id });

      res.json({
        success: true,
        data: hotel,
        message: 'Hotel updated successfully'
      });

    } catch (error) {
      logger.error('Error in hotel update', error);
      throw error;
    }
  })
);

// =============================================================================
// 7. DELETE HOTEL (Admin only)
// =============================================================================

router.delete('/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      // Check if hotel exists
      const { data: existingHotel } = await supabase
        .from('hotels')
        .select('id')
        .eq('id', id)
        .single();

      if (!existingHotel) {
        return res.status(404).json({
          success: false,
          error: 'Hotel not found',
          code: 'HOTEL_NOT_FOUND'
        });
      }

      // Check for existing bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('item_type', 'hotel')
        .eq('item_id', id)
        .limit(1);

      if (bookings && bookings.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Cannot delete hotel with existing bookings',
          code: 'HOTEL_HAS_BOOKINGS'
        });
      }

      const { error } = await supabase
        .from('hotels')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Error deleting hotel', error);
        throw error;
      }

      logger.info('Hotel deleted successfully', { hotelId: id });

      res.json({
        success: true,
        message: 'Hotel deleted successfully'
      });

    } catch (error) {
      logger.error('Error in hotel deletion', error);
      throw error;
    }
  })
);

// =============================================================================
// 8. GET FEATURED HOTELS
// =============================================================================

router.get('/featured/list',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 6;

    try {
      const { data: hotels, error } = await supabase
        .from('hotels')
        .select('*')
        .eq('is_featured', true)
        .gt('available_rooms', 0)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching featured hotels', error);
        throw error;
      }

      logger.info('Featured hotels fetched', { count: hotels?.length || 0 });

      res.json({
        success: true,
        data: hotels || []
      });

    } catch (error) {
      logger.error('Error in featured hotels endpoint', error);
      throw error;
    }
  })
);

// =============================================================================
// 9. SEARCH HOTELS BY LOCATION
// =============================================================================

router.get('/search/location',
  asyncHandler(async (req: Request, res: Response) => {
    const { q: query, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
        code: 'MISSING_SEARCH_QUERY'
      });
    }

    try {
      const { data: hotels, error } = await supabase
        .from('hotels')
        .select('id, name, slug, location_city, location_state, price_per_night, star_rating, images')
        .or(`location_city.ilike.%${query}%,location_state.ilike.%${query}%,name.ilike.%${query}%`)
        .limit(parseInt(limit as string));

      if (error) {
        logger.error('Error searching hotels', error);
        throw error;
      }

      logger.info('Hotel search completed', { 
        query, 
        resultsCount: hotels?.length || 0 
      });

      res.json({
        success: true,
        data: hotels || [],
        query: query as string
      });

    } catch (error) {
      logger.error('Error in hotel search', error);
      throw error;
    }
  })
);

export default router;

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

const tourSearchSchema = z.object({
  // Pagination
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  
  // Search filters
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  minPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  duration: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  difficulty: z.enum(['easy', 'moderate', 'challenging']).optional(),
  tourType: z.enum(['spiritual', 'adventure', 'cultural', 'luxury']).optional(),
  
  // Sorting
  sortBy: z.enum(['price', 'duration', 'name', 'created_at']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  
  // Features
  isFeatured: z.string().optional().transform(val => val === 'true'),
});

const itineraryItemSchema = z.object({
  day: z.number().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  activities: z.array(z.string()).default([]),
  meals: z.array(z.string()).default([]),
  accommodation: z.string().optional(),
  highlights: z.array(z.string()).default([]),
  duration: z.string().optional(),
  location: z.string().optional(),
});

const tourCreateSchema = z.object({
  name: z.string().min(1, 'Tour name is required'),
  slug: z.string().min(1, 'Tour slug is required'),
  description: z.string().min(1, 'Tour description is required'),
  location_city: z.string().min(1, 'City is required'),
  location_state: z.string().min(1, 'State is required'),
  duration_days: z.number().min(1, 'Duration must be at least 1 day'),
  difficulty: z.enum(['easy', 'moderate', 'challenging']).default('easy'),
  tour_type: z.enum(['spiritual', 'adventure', 'cultural', 'luxury']).default('cultural'),
  itinerary: z.array(itineraryItemSchema).min(1, 'At least one itinerary item is required'),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  price_per_person: z.number().min(0, 'Price must be positive'),
  max_group_size: z.number().min(1).default(20),
  is_featured: z.boolean().default(false),
});

const tourUpdateSchema = tourCreateSchema.partial();

// =============================================================================
// 2. GET TOURS WITH PAGINATION AND FILTERS
// =============================================================================

router.get('/', 
  validateRequest({ query: tourSearchSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      city,
      state,
      country,
      minPrice,
      maxPrice,
      duration,
      difficulty,
      tourType,
      sortBy = 'created_at',
      sortOrder = 'desc',
      isFeatured
    } = req.query as any;

    try {
      // Build query
      let query = supabase
        .from('tours')
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
        query = query.gte('price_per_person', minPrice);
      }
      
      if (maxPrice !== undefined) {
        query = query.lte('price_per_person', maxPrice);
      }
      
      if (duration !== undefined) {
        query = query.eq('duration_days', duration);
      }
      
      if (difficulty) {
        query = query.eq('difficulty', difficulty);
      }
      
      if (tourType) {
        query = query.eq('tour_type', tourType);
      }
      
      if (isFeatured !== undefined) {
        query = query.eq('is_featured', isFeatured);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data: tours, error, count } = await query;

      if (error) {
        logger.error('Error fetching tours', error);
        throw error;
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil((count || 0) / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      logger.info('Tours fetched successfully', {
        count: tours?.length || 0,
        totalCount: count || 0,
        page,
        limit,
        filters: req.query
      });

      res.json({
        success: true,
        data: tours || [],
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
      logger.error('Error in tours GET endpoint', error);
      throw error;
    }
  })
);

// =============================================================================
// 3. GET TOUR BY ID
// =============================================================================

router.get('/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const { data: tour, error } = await supabase
        .from('tours')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Tour not found',
            code: 'TOUR_NOT_FOUND'
          });
        }
        throw error;
      }

      logger.info('Tour fetched by ID', { tourId: id });

      res.json({
        success: true,
        data: tour
      });

    } catch (error) {
      logger.error('Error fetching tour by ID', error);
      throw error;
    }
  })
);

// =============================================================================
// 4. GET TOUR BY SLUG
// =============================================================================

router.get('/slug/:slug',
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;

    try {
      const { data: tour, error } = await supabase
        .from('tours')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Tour not found',
            code: 'TOUR_NOT_FOUND'
          });
        }
        throw error;
      }

      logger.info('Tour fetched by slug', { slug });

      res.json({
        success: true,
        data: tour
      });

    } catch (error) {
      logger.error('Error fetching tour by slug', error);
      throw error;
    }
  })
);

// =============================================================================
// 5. CREATE TOUR (Admin only)
// =============================================================================

router.post('/',
  validateRequest({ body: tourCreateSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const tourData = req.body;

    try {
      // Check if slug already exists
      const { data: existingTour } = await supabase
        .from('tours')
        .select('id')
        .eq('slug', tourData.slug)
        .single();

      if (existingTour) {
        return res.status(409).json({
          success: false,
          error: 'Tour with this slug already exists',
          code: 'TOUR_SLUG_EXISTS'
        });
      }

      // Validate itinerary days match duration
      const itineraryDays = tourData.itinerary.map((item: any) => item.day);
      const maxDay = Math.max(...itineraryDays);
      if (maxDay > tourData.duration_days) {
        return res.status(400).json({
          success: false,
          error: 'Itinerary days cannot exceed tour duration',
          code: 'INVALID_ITINERARY_DURATION'
        });
      }

      const { data: tour, error } = await supabase
        .from('tours')
        .insert([tourData])
        .select()
        .single();

      if (error) {
        logger.error('Error creating tour', error);
        throw error;
      }

      logger.info('Tour created successfully', { tourId: tour.id });

      res.status(201).json({
        success: true,
        data: tour,
        message: 'Tour created successfully'
      });

    } catch (error) {
      logger.error('Error in tour creation', error);
      throw error;
    }
  })
);

// =============================================================================
// 6. UPDATE TOUR (Admin only)
// =============================================================================

router.put('/:id',
  validateRequest({ body: tourUpdateSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
      // Check if tour exists
      const { data: existingTour } = await supabase
        .from('tours')
        .select('id')
        .eq('id', id)
        .single();

      if (!existingTour) {
        return res.status(404).json({
          success: false,
          error: 'Tour not found',
          code: 'TOUR_NOT_FOUND'
        });
      }

      // If slug is being updated, check for conflicts
      if (updateData.slug) {
        const { data: slugConflict } = await supabase
          .from('tours')
          .select('id')
          .eq('slug', updateData.slug)
          .neq('id', id)
          .single();

        if (slugConflict) {
          return res.status(409).json({
            success: false,
            error: 'Tour with this slug already exists',
            code: 'TOUR_SLUG_EXISTS'
          });
        }
      }

      // Validate itinerary if provided
      if (updateData.itinerary && updateData.duration_days) {
        const itineraryDays = updateData.itinerary.map((item: any) => item.day);
        const maxDay = Math.max(...itineraryDays);
        if (maxDay > updateData.duration_days) {
          return res.status(400).json({
            success: false,
            error: 'Itinerary days cannot exceed tour duration',
            code: 'INVALID_ITINERARY_DURATION'
          });
        }
      }

      const { data: tour, error } = await supabase
        .from('tours')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating tour', error);
        throw error;
      }

      logger.info('Tour updated successfully', { tourId: id });

      res.json({
        success: true,
        data: tour,
        message: 'Tour updated successfully'
      });

    } catch (error) {
      logger.error('Error in tour update', error);
      throw error;
    }
  })
);

// =============================================================================
// 7. DELETE TOUR (Admin only)
// =============================================================================

router.delete('/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      // Check if tour exists
      const { data: existingTour } = await supabase
        .from('tours')
        .select('id')
        .eq('id', id)
        .single();

      if (!existingTour) {
        return res.status(404).json({
          success: false,
          error: 'Tour not found',
          code: 'TOUR_NOT_FOUND'
        });
      }

      // Check for existing bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('item_type', 'tour')
        .eq('item_id', id)
        .limit(1);

      if (bookings && bookings.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Cannot delete tour with existing bookings',
          code: 'TOUR_HAS_BOOKINGS'
        });
      }

      const { error } = await supabase
        .from('tours')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Error deleting tour', error);
        throw error;
      }

      logger.info('Tour deleted successfully', { tourId: id });

      res.json({
        success: true,
        message: 'Tour deleted successfully'
      });

    } catch (error) {
      logger.error('Error in tour deletion', error);
      throw error;
    }
  })
);

// =============================================================================
// 8. GET FEATURED TOURS
// =============================================================================

router.get('/featured/list',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 6;

    try {
      const { data: tours, error } = await supabase
        .from('tours')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching featured tours', error);
        throw error;
      }

      logger.info('Featured tours fetched', { count: tours?.length || 0 });

      res.json({
        success: true,
        data: tours || []
      });

    } catch (error) {
      logger.error('Error in featured tours endpoint', error);
      throw error;
    }
  })
);

// =============================================================================
// 9. SEARCH TOURS BY LOCATION
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
      const { data: tours, error } = await supabase
        .from('tours')
        .select('id, name, slug, location_city, location_state, price_per_person, duration_days, tour_type, images')
        .or(`location_city.ilike.%${query}%,location_state.ilike.%${query}%,name.ilike.%${query}%`)
        .limit(parseInt(limit as string));

      if (error) {
        logger.error('Error searching tours', error);
        throw error;
      }

      logger.info('Tour search completed', { 
        query, 
        resultsCount: tours?.length || 0 
      });

      res.json({
        success: true,
        data: tours || [],
        query: query as string
      });

    } catch (error) {
      logger.error('Error in tour search', error);
      throw error;
    }
  })
);

// =============================================================================
// 10. GET TOURS BY TYPE
// =============================================================================

router.get('/type/:tourType',
  asyncHandler(async (req: Request, res: Response) => {
    const { tourType } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    // Validate tour type
    const validTypes = ['spiritual', 'adventure', 'cultural', 'luxury'];
    if (!validTypes.includes(tourType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tour type',
        code: 'INVALID_TOUR_TYPE',
        validTypes
      });
    }

    try {
      const { data: tours, error } = await supabase
        .from('tours')
        .select('*')
        .eq('tour_type', tourType)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching tours by type', error);
        throw error;
      }

      logger.info('Tours fetched by type', { 
        tourType, 
        count: tours?.length || 0 
      });

      res.json({
        success: true,
        data: tours || [],
        tourType
      });

    } catch (error) {
      logger.error('Error in tours by type endpoint', error);
      throw error;
    }
  })
);

// =============================================================================
// 11. GET TOUR ITINERARY
// =============================================================================

router.get('/:id/itinerary',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const { data: tour, error } = await supabase
        .from('tours')
        .select('id, name, itinerary, duration_days')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Tour not found',
            code: 'TOUR_NOT_FOUND'
          });
        }
        throw error;
      }

      logger.info('Tour itinerary fetched', { tourId: id });

      res.json({
        success: true,
        data: {
          tourId: tour.id,
          tourName: tour.name,
          duration: tour.duration_days,
          itinerary: tour.itinerary
        }
      });

    } catch (error) {
      logger.error('Error fetching tour itinerary', error);
      throw error;
    }
  })
);

export default router;

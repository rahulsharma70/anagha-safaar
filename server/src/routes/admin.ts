import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { supabase } from '../app';
import { logger } from '../lib/logger';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/index';
import { adminMiddleware } from '../middleware/admin';

const router = Router();

// =============================================================================
// 1. MULTER CONFIGURATION FOR IMAGE UPLOADS
// =============================================================================

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
  },
});

// =============================================================================
// 2. VALIDATION SCHEMAS
// =============================================================================

const hotelCreateSchema = z.object({
  name: z.string().min(1, 'Hotel name is required'),
  slug: z.string().min(1, 'Hotel slug is required'),
  description: z.string().min(1, 'Hotel description is required'),
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
  total_rooms: z.number().min(0).default(0),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  check_in_time: z.string().default('14:00'),
  check_out_time: z.string().default('11:00'),
  policies: z.object({
    cancellation: z.string().optional(),
    check_in: z.string().optional(),
    check_out: z.string().optional(),
    pets: z.string().optional(),
    smoking: z.string().optional(),
  }).optional(),
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
  itinerary: z.array(z.object({
    day: z.number().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    activities: z.array(z.string()).default([]),
    meals: z.array(z.string()).default([]),
    accommodation: z.string().optional(),
    highlights: z.array(z.string()).default([]),
    duration: z.string().optional(),
    location: z.string().optional(),
  })).min(1, 'At least one itinerary item is required'),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  price_per_person: z.number().min(0, 'Price must be positive'),
  max_group_size: z.number().min(1).default(20),
  min_group_size: z.number().min(1).default(1),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  departure_times: z.array(z.string()).default([]),
  meeting_point: z.string().optional(),
  requirements: z.array(z.string()).default([]),
  cancellation_policy: z.string().optional(),
});

const flightCreateSchema = z.object({
  airline: z.string().min(1, 'Airline is required'),
  flight_number: z.string().min(1, 'Flight number is required'),
  departure_city: z.string().min(1, 'Departure city is required'),
  arrival_city: z.string().min(1, 'Arrival city is required'),
  departure_time: z.string().datetime(),
  arrival_time: z.string().datetime(),
  price_economy: z.number().min(0, 'Economy price must be positive'),
  price_business: z.number().min(0).optional(),
  price_first: z.number().min(0).optional(),
  available_seats: z.number().min(0),
  total_seats: z.number().min(0),
  total_stops: z.number().min(0).default(0),
  duration_minutes: z.number().min(0).optional(),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  aircraft_type: z.string().optional(),
  baggage_allowance: z.object({
    economy: z.string().optional(),
    business: z.string().optional(),
    first: z.string().optional(),
  }).optional(),
  amenities: z.array(z.string()).default([]),
});

const pricingUpdateSchema = z.object({
  item_type: z.enum(['hotel', 'tour', 'flight']),
  item_id: z.string().uuid(),
  date: z.string().datetime(),
  price: z.number().min(0),
  availability: z.number().min(0),
  is_active: z.boolean().default(true),
});

// =============================================================================
// 3. IMAGE UPLOAD SERVICE
// =============================================================================

class ImageUploadService {
  static async uploadToSupabase(file: Express.Multer.File, folder: string, itemId: string): Promise<string> {
    try {
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${itemId}_${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('content-images')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        logger.error('Error uploading to Supabase Storage', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(filePath);

      logger.info('Image uploaded successfully', {
        fileName,
        filePath,
        publicUrl,
        size: file.size
      });

      return publicUrl;

    } catch (error) {
      logger.error('Error in image upload service', error);
      throw error;
    }
  }

  static async deleteFromSupabase(imageUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const folder = urlParts[urlParts.length - 2];
      const filePath = `${folder}/${fileName}`;

      const { error } = await supabase.storage
        .from('content-images')
        .remove([filePath]);

      if (error) {
        logger.error('Error deleting from Supabase Storage', error);
        throw error;
      }

      logger.info('Image deleted successfully', { filePath });

    } catch (error) {
      logger.error('Error in image deletion service', error);
      throw error;
    }
  }
}

// =============================================================================
// 4. HOTEL MANAGEMENT ROUTES
// =============================================================================

// Create hotel
router.post('/hotels',
  adminMiddleware,
  validateRequest({ body: hotelCreateSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const hotelData = req.body;

    try {
      // Check for existing slug
      const { data: existingHotel } = await supabase
        .from('hotels')
        .select('id')
        .eq('slug', hotelData.slug)
        .single();

      if (existingHotel) {
        return res.status(409).json({
          success: false,
          error: 'Hotel with this slug already exists',
          code: 'DUPLICATE_SLUG'
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

      logger.info('Hotel created successfully', { hotelId: hotel.id, hotelName: hotel.name });
      res.status(201).json({ success: true, data: hotel });

    } catch (error) {
      logger.error('Error in hotel creation', error);
      throw error;
    }
  })
);

// Upload hotel images
router.post('/hotels/:id/images',
  adminMiddleware,
  upload.array('images', 10),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No images provided',
        code: 'NO_IMAGES'
      });
    }

    try {
      const uploadedImages: string[] = [];

      for (const file of files) {
        const imageUrl = await ImageUploadService.uploadToSupabase(file, 'hotels', id);
        uploadedImages.push(imageUrl);
      }

      // Update hotel with new images
      const { data: hotel, error } = await supabase
        .from('hotels')
        .update({
          images: uploadedImages,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating hotel images', error);
        throw error;
      }

      logger.info('Hotel images uploaded successfully', {
        hotelId: id,
        imageCount: uploadedImages.length
      });

      res.json({
        success: true,
        data: {
          hotel,
          uploadedImages
        },
        message: 'Images uploaded successfully'
      });

    } catch (error) {
      logger.error('Error uploading hotel images', error);
      throw error;
    }
  })
);

// Update hotel
router.put('/hotels/:id',
  adminMiddleware,
  validateRequest({ body: hotelCreateSchema.partial() }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
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
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Hotel not found',
            code: 'HOTEL_NOT_FOUND'
          });
        }
        logger.error(`Error updating hotel with ID ${id}`, error);
        throw error;
      }

      logger.info(`Hotel updated successfully: ${id}`);
      res.json({ success: true, data: hotel });

    } catch (error) {
      logger.error(`Error in hotel update for ID ${id}`, error);
      throw error;
    }
  })
);

// Delete hotel
router.delete('/hotels/:id',
  adminMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      // Get hotel images to delete
      const { data: hotel } = await supabase
        .from('hotels')
        .select('images')
        .eq('id', id)
        .single();

      // Delete images from storage
      if (hotel?.images) {
        for (const imageUrl of hotel.images) {
          await ImageUploadService.deleteFromSupabase(imageUrl);
        }
      }

      const { error, count } = await supabase
        .from('hotels')
        .delete()
        .eq('id', id)
        .select('*', { count: 'exact' });

      if (error) {
        logger.error(`Error deleting hotel with ID ${id}`, error);
        throw error;
      }

      if (count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Hotel not found',
          code: 'HOTEL_NOT_FOUND'
        });
      }

      logger.info(`Hotel deleted successfully: ${id}`);
      res.json({ success: true, message: 'Hotel deleted successfully' });

    } catch (error) {
      logger.error(`Error in hotel deletion for ID ${id}`, error);
      throw error;
    }
  })
);

// =============================================================================
// 5. TOUR MANAGEMENT ROUTES
// =============================================================================

// Create tour
router.post('/tours',
  adminMiddleware,
  validateRequest({ body: tourCreateSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const tourData = req.body;

    try {
      // Check for existing slug
      const { data: existingTour } = await supabase
        .from('tours')
        .select('id')
        .eq('slug', tourData.slug)
        .single();

      if (existingTour) {
        return res.status(409).json({
          success: false,
          error: 'Tour with this slug already exists',
          code: 'DUPLICATE_SLUG'
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

      logger.info('Tour created successfully', { tourId: tour.id, tourName: tour.name });
      res.status(201).json({ success: true, data: tour });

    } catch (error) {
      logger.error('Error in tour creation', error);
      throw error;
    }
  })
);

// Upload tour images
router.post('/tours/:id/images',
  adminMiddleware,
  upload.array('images', 10),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No images provided',
        code: 'NO_IMAGES'
      });
    }

    try {
      const uploadedImages: string[] = [];

      for (const file of files) {
        const imageUrl = await ImageUploadService.uploadToSupabase(file, 'tours', id);
        uploadedImages.push(imageUrl);
      }

      // Update tour with new images
      const { data: tour, error } = await supabase
        .from('tours')
        .update({
          images: uploadedImages,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating tour images', error);
        throw error;
      }

      logger.info('Tour images uploaded successfully', {
        tourId: id,
        imageCount: uploadedImages.length
      });

      res.json({
        success: true,
        data: {
          tour,
          uploadedImages
        },
        message: 'Images uploaded successfully'
      });

    } catch (error) {
      logger.error('Error uploading tour images', error);
      throw error;
    }
  })
);

// Update tour
router.put('/tours/:id',
  adminMiddleware,
  validateRequest({ body: tourCreateSchema.partial() }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
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
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Tour not found',
            code: 'TOUR_NOT_FOUND'
          });
        }
        logger.error(`Error updating tour with ID ${id}`, error);
        throw error;
      }

      logger.info(`Tour updated successfully: ${id}`);
      res.json({ success: true, data: tour });

    } catch (error) {
      logger.error(`Error in tour update for ID ${id}`, error);
      throw error;
    }
  })
);

// Delete tour
router.delete('/tours/:id',
  adminMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      // Get tour images to delete
      const { data: tour } = await supabase
        .from('tours')
        .select('images')
        .eq('id', id)
        .single();

      // Delete images from storage
      if (tour?.images) {
        for (const imageUrl of tour.images) {
          await ImageUploadService.deleteFromSupabase(imageUrl);
        }
      }

      const { error, count } = await supabase
        .from('tours')
        .delete()
        .eq('id', id)
        .select('*', { count: 'exact' });

      if (error) {
        logger.error(`Error deleting tour with ID ${id}`, error);
        throw error;
      }

      if (count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Tour not found',
          code: 'TOUR_NOT_FOUND'
        });
      }

      logger.info(`Tour deleted successfully: ${id}`);
      res.json({ success: true, message: 'Tour deleted successfully' });

    } catch (error) {
      logger.error(`Error in tour deletion for ID ${id}`, error);
      throw error;
    }
  })
);

// =============================================================================
// 6. FLIGHT MANAGEMENT ROUTES
// =============================================================================

// Create flight
router.post('/flights',
  adminMiddleware,
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

      logger.info('Flight created successfully', { flightId: flight.id, flightNumber: flight.flight_number });
      res.status(201).json({ success: true, data: flight });

    } catch (error) {
      logger.error('Error in flight creation', error);
      throw error;
    }
  })
);

// Update flight
router.put('/flights/:id',
  adminMiddleware,
  validateRequest({ body: flightCreateSchema.partial() }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
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
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Flight not found',
            code: 'FLIGHT_NOT_FOUND'
          });
        }
        logger.error(`Error updating flight with ID ${id}`, error);
        throw error;
      }

      logger.info(`Flight updated successfully: ${id}`);
      res.json({ success: true, data: flight });

    } catch (error) {
      logger.error(`Error in flight update for ID ${id}`, error);
      throw error;
    }
  })
);

// Delete flight
router.delete('/flights/:id',
  adminMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const { error, count } = await supabase
        .from('flights')
        .delete()
        .eq('id', id)
        .select('*', { count: 'exact' });

      if (error) {
        logger.error(`Error deleting flight with ID ${id}`, error);
        throw error;
      }

      if (count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Flight not found',
          code: 'FLIGHT_NOT_FOUND'
        });
      }

      logger.info(`Flight deleted successfully: ${id}`);
      res.json({ success: true, message: 'Flight deleted successfully' });

    } catch (error) {
      logger.error(`Error in flight deletion for ID ${id}`, error);
      throw error;
    }
  })
);

// =============================================================================
// 7. PRICING & AVAILABILITY MANAGEMENT
// =============================================================================

// Update pricing and availability
router.post('/pricing',
  adminMiddleware,
  validateRequest({ body: pricingUpdateSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { item_type, item_id, date, price, availability, is_active } = req.body;

    try {
      // Check if pricing record exists
      const { data: existingPricing } = await supabase
        .from('pricing_availability')
        .select('id')
        .eq('item_type', item_type)
        .eq('item_id', item_id)
        .eq('date', date)
        .single();

      let pricingRecord;

      if (existingPricing) {
        // Update existing record
        const { data, error } = await supabase
          .from('pricing_availability')
          .update({
            price,
            availability,
            is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPricing.id)
          .select()
          .single();

        if (error) {
          logger.error('Error updating pricing', error);
          throw error;
        }

        pricingRecord = data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('pricing_availability')
          .insert([{
            item_type,
            item_id,
            date,
            price,
            availability,
            is_active,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) {
          logger.error('Error creating pricing record', error);
          throw error;
        }

        pricingRecord = data;
      }

      logger.info('Pricing updated successfully', {
        itemType: item_type,
        itemId: item_id,
        date,
        price,
        availability
      });

      res.json({
        success: true,
        data: pricingRecord,
        message: 'Pricing updated successfully'
      });

    } catch (error) {
      logger.error('Error in pricing update', error);
      throw error;
    }
  })
);

// Bulk update pricing
router.post('/pricing/bulk',
  adminMiddleware,
  validateRequest({ 
    body: z.object({
      updates: z.array(pricingUpdateSchema).min(1, 'At least one update required')
    })
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { updates } = req.body;

    try {
      const results = [];

      for (const update of updates) {
        const { item_type, item_id, date, price, availability, is_active } = update;

        // Check if pricing record exists
        const { data: existingPricing } = await supabase
          .from('pricing_availability')
          .select('id')
          .eq('item_type', item_type)
          .eq('item_id', item_id)
          .eq('date', date)
          .single();

        let pricingRecord;

        if (existingPricing) {
          // Update existing record
          const { data, error } = await supabase
            .from('pricing_availability')
            .update({
              price,
              availability,
              is_active,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPricing.id)
            .select()
            .single();

          if (error) {
            logger.error('Error updating pricing in bulk', error);
            continue;
          }

          pricingRecord = data;
        } else {
          // Create new record
          const { data, error } = await supabase
            .from('pricing_availability')
            .insert([{
              item_type,
              item_id,
              date,
              price,
              availability,
              is_active,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select()
            .single();

          if (error) {
            logger.error('Error creating pricing record in bulk', error);
            continue;
          }

          pricingRecord = data;
        }

        results.push(pricingRecord);
      }

      logger.info('Bulk pricing update completed', {
        totalUpdates: updates.length,
        successfulUpdates: results.length
      });

      res.json({
        success: true,
        data: results,
        message: `Bulk pricing update completed: ${results.length}/${updates.length} successful`
      });

    } catch (error) {
      logger.error('Error in bulk pricing update', error);
      throw error;
    }
  })
);

// Get pricing for item
router.get('/pricing/:item_type/:item_id',
  adminMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { item_type, item_id } = req.params;
    const { start_date, end_date, page = 1, limit = 50 } = req.query as any;

    try {
      let query = supabase
        .from('pricing_availability')
        .select('*', { count: 'exact' })
        .eq('item_type', item_type)
        .eq('item_id', item_id)
        .order('date', { ascending: true });

      if (start_date) {
        query = query.gte('date', start_date);
      }

      if (end_date) {
        query = query.lte('date', end_date);
      }

      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data: pricing, error, count } = await query;

      if (error) {
        logger.error('Error fetching pricing', error);
        throw error;
      }

      const totalPages = Math.ceil((count || 0) / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      logger.info('Pricing fetched successfully', {
        itemType: item_type,
        itemId: item_id,
        count: pricing?.length || 0,
        totalCount: count || 0
      });

      res.json({
        success: true,
        data: pricing || [],
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
      logger.error('Error in pricing fetch', error);
      throw error;
    }
  })
);

// =============================================================================
// 8. CONTENT ANALYTICS
// =============================================================================

// Get content analytics
router.get('/analytics',
  adminMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { period = '30d', type } = req.query as any;

    try {
      const analytics = {
        hotels: {
          total: 0,
          active: 0,
          featured: 0,
          recent: 0
        },
        tours: {
          total: 0,
          active: 0,
          featured: 0,
          recent: 0
        },
        flights: {
          total: 0,
          active: 0,
          featured: 0,
          recent: 0
        }
      };

      // Get hotel analytics
      const { data: hotelStats } = await supabase
        .from('hotels')
        .select('id, is_active, is_featured, created_at');

      if (hotelStats) {
        analytics.hotels.total = hotelStats.length;
        analytics.hotels.active = hotelStats.filter(h => h.is_active).length;
        analytics.hotels.featured = hotelStats.filter(h => h.is_featured).length;
        analytics.hotels.recent = hotelStats.filter(h => {
          const createdDate = new Date(h.created_at);
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - parseInt(period.replace('d', '')));
          return createdDate >= cutoffDate;
        }).length;
      }

      // Get tour analytics
      const { data: tourStats } = await supabase
        .from('tours')
        .select('id, is_active, is_featured, created_at');

      if (tourStats) {
        analytics.tours.total = tourStats.length;
        analytics.tours.active = tourStats.filter(t => t.is_active).length;
        analytics.tours.featured = tourStats.filter(t => t.is_featured).length;
        analytics.tours.recent = tourStats.filter(t => {
          const createdDate = new Date(t.created_at);
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - parseInt(period.replace('d', '')));
          return createdDate >= cutoffDate;
        }).length;
      }

      // Get flight analytics
      const { data: flightStats } = await supabase
        .from('flights')
        .select('id, is_active, is_featured, created_at');

      if (flightStats) {
        analytics.flights.total = flightStats.length;
        analytics.flights.active = flightStats.filter(f => f.is_active).length;
        analytics.flights.featured = flightStats.filter(f => f.is_featured).length;
        analytics.flights.recent = flightStats.filter(f => {
          const createdDate = new Date(f.created_at);
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - parseInt(period.replace('d', '')));
          return createdDate >= cutoffDate;
        }).length;
      }

      logger.info('Content analytics fetched successfully', {
        period,
        analytics
      });

      res.json({
        success: true,
        data: analytics,
        period
      });

    } catch (error) {
      logger.error('Error fetching content analytics', error);
      throw error;
    }
  })
);

export default router;

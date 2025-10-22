import { Router, Request, Response } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../app';
import { logger } from '../lib/logger';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/index';

const router = Router();

// =============================================================================
// 1. AI CLIENT INITIALIZATION
// =============================================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// =============================================================================
// 2. VALIDATION SCHEMAS
// =============================================================================

const itineraryRequestSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  travelers: z.number().min(1, 'At least 1 traveler required').max(20, 'Maximum 20 travelers'),
  budget: z.object({
    min: z.number().min(0, 'Minimum budget must be positive'),
    max: z.number().min(0, 'Maximum budget must be positive'),
    currency: z.string().default('INR')
  }),
  interests: z.array(z.enum([
    'culture', 'adventure', 'nature', 'food', 'history', 'art', 'music', 
    'shopping', 'nightlife', 'beaches', 'mountains', 'wildlife', 'spiritual',
    'wellness', 'photography', 'architecture', 'festivals', 'local_experiences'
  ])).min(1, 'At least one interest required'),
  accommodationType: z.enum(['budget', 'mid_range', 'luxury', 'boutique', 'hostel', 'resort']).default('mid_range'),
  travelStyle: z.enum(['relaxed', 'moderate', 'intensive', 'flexible']).default('moderate'),
  specialRequirements: z.string().optional(),
  aiProvider: z.enum(['openai', 'anthropic']).default('openai'),
  includeRestaurants: z.boolean().default(true),
  includeActivities: z.boolean().default(true),
  includeTransportation: z.boolean().default(true),
  includeAccommodation: z.boolean().default(true),
});

const itineraryUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// =============================================================================
// 3. INTERFACES AND TYPES
// =============================================================================

interface ItineraryDay {
  day: number;
  date: string;
  title: string;
  description: string;
  activities: Activity[];
  meals: Meal[];
  accommodation?: Accommodation;
  transportation?: Transportation[];
  estimatedCost: number;
  duration: string;
  highlights: string[];
}

interface Activity {
  id: string;
  name: string;
  description: string;
  type: 'attraction' | 'experience' | 'tour' | 'leisure' | 'cultural';
  location: {
    name: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  duration: string;
  cost: number;
  bookingRequired: boolean;
  bestTime: string;
  tips: string[];
  rating?: number;
  images?: string[];
}

interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  cuisine: string;
  location: {
    name: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  cost: number;
  rating?: number;
  specialties: string[];
  bookingRequired: boolean;
  tips: string[];
}

interface Accommodation {
  id: string;
  name: string;
  type: 'hotel' | 'resort' | 'hostel' | 'apartment' | 'homestay';
  location: {
    name: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  cost: number;
  rating?: number;
  amenities: string[];
  checkIn: string;
  checkOut: string;
  bookingRequired: boolean;
  tips: string[];
}

interface Transportation {
  id: string;
  type: 'flight' | 'train' | 'bus' | 'taxi' | 'metro' | 'walking' | 'car_rental';
  from: string;
  to: string;
  duration: string;
  cost: number;
  bookingRequired: boolean;
  tips: string[];
}

interface GeneratedItinerary {
  id: string;
  title: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration: number;
  travelers: number;
  budget: {
    min: number;
    max: number;
    currency: string;
    estimatedTotal: number;
  };
  interests: string[];
  travelStyle: string;
  accommodationType: string;
  days: ItineraryDay[];
  summary: {
    totalActivities: number;
    totalMeals: number;
    totalCost: number;
    highlights: string[];
    tips: string[];
  };
  metadata: {
    aiProvider: string;
    generatedAt: string;
    version: string;
    processingTime: number;
  };
}

// =============================================================================
// 4. AI ITINERARY GENERATION
// =============================================================================

router.post('/itinerary',
  validateRequest({ body: itineraryRequestSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const requestData = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const startTime = Date.now();
    const itineraryId = `itinerary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      logger.info('Generating AI itinerary', {
        userId,
        itineraryId,
        destination: requestData.destination,
        startDate: requestData.startDate,
        endDate: requestData.endDate,
        travelers: requestData.travelers,
        aiProvider: requestData.aiProvider
      });

      // Generate itinerary using selected AI provider
      let generatedItinerary: GeneratedItinerary;
      
      if (requestData.aiProvider === 'anthropic') {
        generatedItinerary = await generateItineraryWithClaude(requestData, itineraryId);
      } else {
        generatedItinerary = await generateItineraryWithGPT4(requestData, itineraryId);
      }

      // Store itinerary in database
      const { data: storedItinerary, error: storeError } = await supabase
        .from('ai_itineraries')
        .insert([{
          id: itineraryId,
          user_id: userId,
          title: generatedItinerary.title,
          description: generatedItinerary.description,
          destination: generatedItinerary.destination,
          start_date: generatedItinerary.startDate,
          end_date: generatedItinerary.endDate,
          duration: generatedItinerary.duration,
          travelers: generatedItinerary.travelers,
          budget_min: generatedItinerary.budget.min,
          budget_max: generatedItinerary.budget.max,
          budget_currency: generatedItinerary.budget.currency,
          budget_estimated_total: generatedItinerary.budget.estimatedTotal,
          interests: generatedItinerary.interests,
          travel_style: generatedItinerary.travelStyle,
          accommodation_type: generatedItinerary.accommodationType,
          itinerary_data: generatedItinerary,
          ai_provider: generatedItinerary.metadata.aiProvider,
          processing_time: generatedItinerary.metadata.processingTime,
          is_public: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (storeError) {
        logger.error('Error storing itinerary', {
          itineraryId,
          userId,
          error: storeError
        });
        throw storeError;
      }

      const processingTime = Date.now() - startTime;

      logger.info('AI itinerary generated successfully', {
        userId,
        itineraryId,
        destination: requestData.destination,
        duration: generatedItinerary.duration,
        totalCost: generatedItinerary.budget.estimatedTotal,
        processingTime,
        aiProvider: requestData.aiProvider
      });

      res.status(201).json({
        success: true,
        data: {
          itinerary: storedItinerary,
          generatedData: generatedItinerary
        },
        message: 'AI itinerary generated successfully'
      });

    } catch (error) {
      logger.error('Error generating AI itinerary', {
        userId,
        itineraryId,
        destination: requestData.destination,
        error: error.message
      });
      throw error;
    }
  })
);

// =============================================================================
// 5. GPT-4 ITINERARY GENERATION
// =============================================================================

async function generateItineraryWithGPT4(requestData: any, itineraryId: string): Promise<GeneratedItinerary> {
  const startTime = Date.now();

  try {
    const prompt = buildItineraryPrompt(requestData);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert travel planner specializing in creating detailed, personalized itineraries. 
          Generate comprehensive travel itineraries with specific activities, restaurants, accommodations, and transportation.
          Always provide realistic costs, timings, and practical tips. Focus on authentic local experiences.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from GPT-4');
    }

    // Parse the AI response into structured data
    const parsedItinerary = parseAIResponse(response, requestData, itineraryId);
    
    const processingTime = Date.now() - startTime;
    parsedItinerary.metadata.processingTime = processingTime;

    logger.info('GPT-4 itinerary generation completed', {
      itineraryId,
      processingTime,
      responseLength: response.length
    });

    return parsedItinerary;

  } catch (error) {
    logger.error('Error generating itinerary with GPT-4', {
      itineraryId,
      error: error.message
    });
    throw error;
  }
}

// =============================================================================
// 6. CLAUDE ITINERARY GENERATION
// =============================================================================

async function generateItineraryWithClaude(requestData: any, itineraryId: string): Promise<GeneratedItinerary> {
  const startTime = Date.now();

  try {
    const prompt = buildItineraryPrompt(requestData);
    
    const completion = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `You are an expert travel planner specializing in creating detailed, personalized itineraries. 
          Generate comprehensive travel itineraries with specific activities, restaurants, accommodations, and transportation.
          Always provide realistic costs, timings, and practical tips. Focus on authentic local experiences.
          
          ${prompt}`
        }
      ]
    });

    const response = completion.content[0]?.text;
    if (!response) {
      throw new Error('No response from Claude');
    }

    // Parse the AI response into structured data
    const parsedItinerary = parseAIResponse(response, requestData, itineraryId);
    
    const processingTime = Date.now() - startTime;
    parsedItinerary.metadata.processingTime = processingTime;

    logger.info('Claude itinerary generation completed', {
      itineraryId,
      processingTime,
      responseLength: response.length
    });

    return parsedItinerary;

  } catch (error) {
    logger.error('Error generating itinerary with Claude', {
      itineraryId,
      error: error.message
    });
    throw error;
  }
}

// =============================================================================
// 7. PROMPT BUILDING
// =============================================================================

function buildItineraryPrompt(requestData: any): string {
  const duration = Math.ceil((new Date(requestData.endDate).getTime() - new Date(requestData.startDate).getTime()) / (1000 * 60 * 60 * 24));
  
  return `
Create a detailed travel itinerary for the following requirements:

**Destination:** ${requestData.destination}
**Travel Dates:** ${requestData.startDate} to ${requestData.endDate} (${duration} days)
**Number of Travelers:** ${requestData.travelers}
**Budget Range:** ${requestData.budget.currency} ${requestData.budget.min} - ${requestData.budget.max}
**Travel Style:** ${requestData.travelStyle}
**Accommodation Type:** ${requestData.accommodationType}
**Interests:** ${requestData.interests.join(', ')}
${requestData.specialRequirements ? `**Special Requirements:** ${requestData.specialRequirements}` : ''}

**Requirements:**
- Include specific activities, restaurants, and attractions for each day
- Provide realistic costs in ${requestData.budget.currency}
- Include practical tips and best times to visit
- Suggest transportation options between locations
- Include accommodation recommendations
- Focus on authentic local experiences
- Consider the travel style and interests provided

**Output Format:**
Please structure your response as a JSON object with the following format:
{
  "title": "Itinerary title",
  "description": "Brief description",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "title": "Day title",
      "description": "Day description",
      "activities": [
        {
          "name": "Activity name",
          "description": "Activity description",
          "type": "attraction|experience|tour|leisure|cultural",
          "location": {
            "name": "Location name",
            "address": "Full address"
          },
          "duration": "2 hours",
          "cost": 500,
          "bookingRequired": true,
          "bestTime": "Morning",
          "tips": ["Tip 1", "Tip 2"]
        }
      ],
      "meals": [
        {
          "name": "Restaurant name",
          "type": "breakfast|lunch|dinner|snack",
          "cuisine": "Cuisine type",
          "location": {
            "name": "Restaurant name",
            "address": "Address"
          },
          "cost": 300,
          "specialties": ["Dish 1", "Dish 2"],
          "bookingRequired": false,
          "tips": ["Tip 1"]
        }
      ],
      "accommodation": {
        "name": "Hotel name",
        "type": "hotel|resort|hostel|apartment|homestay",
        "location": {
          "name": "Hotel name",
          "address": "Address"
        },
        "cost": 2000,
        "amenities": ["WiFi", "Pool"],
        "checkIn": "2:00 PM",
        "checkOut": "11:00 AM",
        "bookingRequired": true,
        "tips": ["Tip 1"]
      },
      "transportation": [
        {
          "type": "taxi|metro|walking|car_rental",
          "from": "Location A",
          "to": "Location B",
          "duration": "30 minutes",
          "cost": 200,
          "bookingRequired": false,
          "tips": ["Tip 1"]
        }
      ],
      "estimatedCost": 3000,
      "duration": "Full day",
      "highlights": ["Highlight 1", "Highlight 2"]
    }
  ],
  "summary": {
    "totalActivities": 15,
    "totalMeals": 12,
    "totalCost": 25000,
    "highlights": ["Overall highlight 1", "Overall highlight 2"],
    "tips": ["General tip 1", "General tip 2"]
  }
}

Make sure the response is valid JSON and includes realistic, specific recommendations.
`;
}

// =============================================================================
// 8. AI RESPONSE PARSING
// =============================================================================

function parseAIResponse(response: string, requestData: any, itineraryId: string): GeneratedItinerary {
  try {
    // Extract JSON from the response (in case there's extra text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Calculate duration
    const startDate = new Date(requestData.startDate);
    const endDate = new Date(requestData.endDate);
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate total cost
    const totalCost = parsed.summary?.totalCost || parsed.days?.reduce((sum: number, day: any) => sum + (day.estimatedCost || 0), 0) || 0;

    return {
      id: itineraryId,
      title: parsed.title || `${requestData.destination} Adventure`,
      description: parsed.description || `A ${duration}-day itinerary for ${requestData.destination}`,
      destination: requestData.destination,
      startDate: requestData.startDate,
      endDate: requestData.endDate,
      duration: duration,
      travelers: requestData.travelers,
      budget: {
        min: requestData.budget.min,
        max: requestData.budget.max,
        currency: requestData.budget.currency,
        estimatedTotal: totalCost
      },
      interests: requestData.interests,
      travelStyle: requestData.travelStyle,
      accommodationType: requestData.accommodationType,
      days: parsed.days || [],
      summary: parsed.summary || {
        totalActivities: 0,
        totalMeals: 0,
        totalCost: totalCost,
        highlights: [],
        tips: []
      },
      metadata: {
        aiProvider: requestData.aiProvider,
        generatedAt: new Date().toISOString(),
        version: '1.0',
        processingTime: 0 // Will be set by caller
      }
    };

  } catch (error) {
    logger.error('Error parsing AI response', {
      itineraryId,
      error: error.message,
      responsePreview: response.substring(0, 200)
    });
    
    // Return a fallback itinerary structure
    return createFallbackItinerary(requestData, itineraryId);
  }
}

function createFallbackItinerary(requestData: any, itineraryId: string): GeneratedItinerary {
  const startDate = new Date(requestData.startDate);
  const endDate = new Date(requestData.endDate);
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return {
    id: itineraryId,
    title: `${requestData.destination} Travel Itinerary`,
    description: `A ${duration}-day itinerary for ${requestData.destination} with ${requestData.interests.join(', ')} focus`,
    destination: requestData.destination,
    startDate: requestData.startDate,
    endDate: requestData.endDate,
    duration: duration,
    travelers: requestData.travelers,
    budget: {
      min: requestData.budget.min,
      max: requestData.budget.max,
      currency: requestData.budget.currency,
      estimatedTotal: (requestData.budget.min + requestData.budget.max) / 2
    },
    interests: requestData.interests,
    travelStyle: requestData.travelStyle,
    accommodationType: requestData.accommodationType,
    days: [],
    summary: {
      totalActivities: 0,
      totalMeals: 0,
      totalCost: (requestData.budget.min + requestData.budget.max) / 2,
      highlights: [`Explore ${requestData.destination}`, 'Experience local culture'],
      tips: ['Plan ahead', 'Book accommodations in advance']
    },
    metadata: {
      aiProvider: requestData.aiProvider,
      generatedAt: new Date().toISOString(),
      version: '1.0',
      processingTime: 0
    }
  };
}

// =============================================================================
// 9. GET USER ITINERARIES
// =============================================================================

router.get('/itineraries',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { page = 1, limit = 10, destination, isPublic } = req.query as any;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      let query = supabase
        .from('ai_itineraries')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (destination) {
        query = query.ilike('destination', `%${destination}%`);
      }

      if (isPublic !== undefined) {
        query = query.eq('is_public', isPublic === 'true');
      }

      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data: itineraries, error, count } = await query;

      if (error) {
        logger.error('Error fetching itineraries', error);
        throw error;
      }

      const totalPages = Math.ceil((count || 0) / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      logger.info('Itineraries fetched successfully', {
        userId,
        count: itineraries?.length || 0,
        totalCount: count || 0,
        page,
        limit
      });

      res.json({
        success: true,
        data: itineraries || [],
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
      logger.error('Error in itineraries GET endpoint', error);
      throw error;
    }
  })
);

// =============================================================================
// 10. GET ITINERARY BY ID
// =============================================================================

router.get('/itineraries/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      const { data: itinerary, error } = await supabase
        .from('ai_itineraries')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Itinerary not found',
            code: 'ITINERARY_NOT_FOUND'
          });
        }
        logger.error(`Error fetching itinerary with ID ${id}`, error);
        throw error;
      }

      logger.info(`Itinerary fetched successfully by ID: ${id}`);
      res.json({ success: true, data: itinerary });

    } catch (error) {
      logger.error(`Error in itinerary GET by ID endpoint for ID ${id}`, error);
      throw error;
    }
  })
);

// =============================================================================
// 11. UPDATE ITINERARY
// =============================================================================

router.put('/itineraries/:id',
  validateRequest({ body: itineraryUpdateSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      const { data: itinerary, error } = await supabase
        .from('ai_itineraries')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Itinerary not found',
            code: 'ITINERARY_NOT_FOUND'
          });
        }
        logger.error(`Error updating itinerary with ID ${id}`, error);
        throw error;
      }

      logger.info(`Itinerary updated successfully: ${id}`);
      res.json({ success: true, data: itinerary });

    } catch (error) {
      logger.error(`Error in itinerary PUT endpoint for ID ${id}`, error);
      throw error;
    }
  })
);

// =============================================================================
// 12. DELETE ITINERARY
// =============================================================================

router.delete('/itineraries/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      const { error, count } = await supabase
        .from('ai_itineraries')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select('*', { count: 'exact' });

      if (error) {
        logger.error(`Error deleting itinerary with ID ${id}`, error);
        throw error;
      }

      if (count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Itinerary not found',
          code: 'ITINERARY_NOT_FOUND'
        });
      }

      logger.info(`Itinerary deleted successfully: ${id}`);
      res.json({ success: true, message: 'Itinerary deleted successfully' });

    } catch (error) {
      logger.error(`Error in itinerary DELETE endpoint for ID ${id}`, error);
      throw error;
    }
  })
);

export default router;

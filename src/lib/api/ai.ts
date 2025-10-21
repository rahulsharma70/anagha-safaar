import axios from 'axios';

export interface ItineraryRequest {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  travelers: number;
  interests: string[];
  travelStyle: 'budget' | 'mid-range' | 'luxury';
  accommodationType: 'hotel' | 'hostel' | 'resort' | 'homestay';
}

export interface ItineraryDay {
  day: number;
  date: string;
  activities: Activity[];
  meals: Meal[];
  accommodation?: Accommodation;
  transportation?: Transportation;
  estimatedCost: number;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  duration: string;
  cost: number;
  location: string;
  time: string;
  category: 'cultural' | 'adventure' | 'spiritual' | 'nature' | 'food' | 'shopping';
  imageUrl?: string;
  bookingRequired: boolean;
}

export interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  cost: number;
  location: string;
  time: string;
  cuisine: string;
  description: string;
}

export interface Accommodation {
  id: string;
  name: string;
  type: string;
  cost: number;
  location: string;
  rating: number;
  amenities: string[];
  imageUrl?: string;
}

export interface Transportation {
  id: string;
  type: 'flight' | 'train' | 'bus' | 'taxi' | 'rental';
  cost: number;
  duration: string;
  from: string;
  to: string;
  description: string;
}

export interface GeneratedItinerary {
  id: string;
  destination: string;
  duration: number;
  totalCost: number;
  currency: string;
  days: ItineraryDay[];
  summary: string;
  highlights: string[];
  tips: string[];
  createdAt: string;
}

class OpenAIService {
  private apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  private baseURL = 'https://api.openai.com/v1';

  async generateItinerary(request: ItineraryRequest): Promise<GeneratedItinerary> {
    try {
      const prompt = this.buildItineraryPrompt(request);
      
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional travel planner specializing in Indian destinations. Generate detailed, practical itineraries with specific recommendations, costs, and timings.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const itineraryText = response.data.choices[0].message.content;
      return this.parseItineraryResponse(itineraryText, request);
    } catch (error) {
      console.error('OpenAI itinerary generation error:', error);
      throw new Error('Failed to generate itinerary');
    }
  }

  private buildItineraryPrompt(request: ItineraryRequest): string {
    return `
Generate a detailed travel itinerary for ${request.destination} with the following requirements:

- Duration: ${request.startDate} to ${request.endDate}
- Budget: ₹${request.budget} for ${request.travelers} travelers
- Travel Style: ${request.travelStyle}
- Accommodation: ${request.accommodationType}
- Interests: ${request.interests.join(', ')}

Please provide:
1. Day-by-day detailed itinerary
2. Specific activities with timings and costs
3. Meal recommendations with costs
4. Transportation options
5. Accommodation suggestions
6. Total cost breakdown
7. Travel tips and highlights

Format the response as a structured JSON object with the following schema:
{
  "destination": "string",
  "duration": number,
  "totalCost": number,
  "currency": "INR",
  "days": [
    {
      "day": number,
      "date": "string",
      "activities": [
        {
          "id": "string",
          "name": "string",
          "description": "string",
          "duration": "string",
          "cost": number,
          "location": "string",
          "time": "string",
          "category": "string",
          "bookingRequired": boolean
        }
      ],
      "meals": [
        {
          "id": "string",
          "name": "string",
          "type": "string",
          "cost": number,
          "location": "string",
          "time": "string",
          "cuisine": "string",
          "description": "string"
        }
      ],
      "estimatedCost": number
    }
  ],
  "summary": "string",
  "highlights": ["string"],
  "tips": ["string"]
}
    `;
  }

  private parseItineraryResponse(response: string, request: ItineraryRequest): GeneratedItinerary {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const itineraryData = JSON.parse(jsonMatch[0]);
      
      return {
        id: `itinerary_${Date.now()}`,
        destination: itineraryData.destination || request.destination,
        duration: itineraryData.duration || this.calculateDuration(request.startDate, request.endDate),
        totalCost: itineraryData.totalCost || request.budget,
        currency: itineraryData.currency || 'INR',
        days: itineraryData.days || [],
        summary: itineraryData.summary || '',
        highlights: itineraryData.highlights || [],
        tips: itineraryData.tips || [],
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to parse itinerary response:', error);
      // Return a fallback itinerary
      return this.createFallbackItinerary(request);
    }
  }

  private calculateDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  private createFallbackItinerary(request: ItineraryRequest): GeneratedItinerary {
    const duration = this.calculateDuration(request.startDate, request.endDate);
    const dailyBudget = request.budget / duration;

    return {
      id: `itinerary_${Date.now()}`,
      destination: request.destination,
      duration,
      totalCost: request.budget,
      currency: 'INR',
      days: Array.from({ length: duration }, (_, index) => ({
        day: index + 1,
        date: new Date(new Date(request.startDate).getTime() + index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        activities: [
          {
            id: `activity_${index}_1`,
            name: `Explore ${request.destination}`,
            description: 'Discover the local attractions and culture',
            duration: '4 hours',
            cost: dailyBudget * 0.4,
            location: request.destination,
            time: '09:00',
            category: 'cultural' as const,
            bookingRequired: false,
          },
        ],
        meals: [
          {
            id: `meal_${index}_1`,
            name: 'Local Cuisine',
            type: 'lunch' as const,
            cost: dailyBudget * 0.2,
            location: request.destination,
            time: '13:00',
            cuisine: 'Local',
            description: 'Traditional local dishes',
          },
        ],
        estimatedCost: dailyBudget,
      })),
      summary: `A ${duration}-day trip to ${request.destination} with a budget of ₹${request.budget}`,
      highlights: [`Visit ${request.destination}`, 'Experience local culture', 'Try local cuisine'],
      tips: ['Book accommodations in advance', 'Carry local currency', 'Check weather conditions'],
      createdAt: new Date().toISOString(),
    };
  }
}

class AnthropicService {
  private apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  private baseURL = 'https://api.anthropic.com/v1';

  async generateItinerary(request: ItineraryRequest): Promise<GeneratedItinerary> {
    try {
      const prompt = this.buildItineraryPrompt(request);
      
      const response = await axios.post(`${this.baseURL}/messages`, {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }, {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
      });

      const itineraryText = response.data.content[0].text;
      return this.parseItineraryResponse(itineraryText, request);
    } catch (error) {
      console.error('Anthropic itinerary generation error:', error);
      throw new Error('Failed to generate itinerary');
    }
  }

  private buildItineraryPrompt(request: ItineraryRequest): string {
    // Similar to OpenAI prompt but optimized for Claude
    return `
Generate a detailed travel itinerary for ${request.destination} with the following requirements:

- Duration: ${request.startDate} to ${request.endDate}
- Budget: ₹${request.budget} for ${request.travelers} travelers
- Travel Style: ${request.travelStyle}
- Accommodation: ${request.accommodationType}
- Interests: ${request.interests.join(', ')}

Please provide a structured JSON response with day-by-day activities, meals, costs, and practical travel information.
    `;
  }

  private parseItineraryResponse(response: string, request: ItineraryRequest): GeneratedItinerary {
    // Similar parsing logic as OpenAI service
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const itineraryData = JSON.parse(jsonMatch[0]);
      
      return {
        id: `itinerary_${Date.now()}`,
        destination: itineraryData.destination || request.destination,
        duration: itineraryData.duration || this.calculateDuration(request.startDate, request.endDate),
        totalCost: itineraryData.totalCost || request.budget,
        currency: itineraryData.currency || 'INR',
        days: itineraryData.days || [],
        summary: itineraryData.summary || '',
        highlights: itineraryData.highlights || [],
        tips: itineraryData.tips || [],
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to parse itinerary response:', error);
      return this.createFallbackItinerary(request);
    }
  }

  private calculateDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  private createFallbackItinerary(request: ItineraryRequest): GeneratedItinerary {
    // Same fallback logic as OpenAI service
    const duration = this.calculateDuration(request.startDate, request.endDate);
    const dailyBudget = request.budget / duration;

    return {
      id: `itinerary_${Date.now()}`,
      destination: request.destination,
      duration,
      totalCost: request.budget,
      currency: 'INR',
      days: Array.from({ length: duration }, (_, index) => ({
        day: index + 1,
        date: new Date(new Date(request.startDate).getTime() + index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        activities: [
          {
            id: `activity_${index}_1`,
            name: `Explore ${request.destination}`,
            description: 'Discover the local attractions and culture',
            duration: '4 hours',
            cost: dailyBudget * 0.4,
            location: request.destination,
            time: '09:00',
            category: 'cultural' as const,
            bookingRequired: false,
          },
        ],
        meals: [
          {
            id: `meal_${index}_1`,
            name: 'Local Cuisine',
            type: 'lunch' as const,
            cost: dailyBudget * 0.2,
            location: request.destination,
            time: '13:00',
            cuisine: 'Local',
            description: 'Traditional local dishes',
          },
        ],
        estimatedCost: dailyBudget,
      })),
      summary: `A ${duration}-day trip to ${request.destination} with a budget of ₹${request.budget}`,
      highlights: [`Visit ${request.destination}`, 'Experience local culture', 'Try local cuisine'],
      tips: ['Book accommodations in advance', 'Carry local currency', 'Check weather conditions'],
      createdAt: new Date().toISOString(),
    };
  }
}

class AIService {
  private openAI: OpenAIService;
  private anthropic: AnthropicService;

  constructor() {
    this.openAI = new OpenAIService();
    this.anthropic = new AnthropicService();
  }

  async generateItinerary(request: ItineraryRequest): Promise<GeneratedItinerary> {
    try {
      // Try OpenAI first, fallback to Anthropic
      return await this.openAI.generateItinerary(request);
    } catch (error) {
      console.warn('OpenAI failed, trying Anthropic:', error);
      try {
        return await this.anthropic.generateItinerary(request);
      } catch (anthropicError) {
        console.error('Both AI services failed:', anthropicError);
        throw new Error('AI itinerary generation is currently unavailable');
      }
    }
  }
}

export const aiService = new AIService();
export const openAIService = new OpenAIService();
export const anthropicService = new AnthropicService();

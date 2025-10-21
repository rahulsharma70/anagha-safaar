import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import ItineraryGenerator from '../components/ItineraryGenerator'

// Mock the AI service
vi.mock('../lib/api/ai', () => ({
  aiService: {
    generateItinerary: vi.fn().mockResolvedValue({
      id: 'itinerary_123',
      destination: 'Goa',
      duration: 5,
      totalCost: 50000,
      currency: 'INR',
      days: [
        {
          day: 1,
          date: '2024-01-15',
          activities: [
            {
              id: 'activity_1',
              name: 'Beach Visit',
              description: 'Visit Calangute Beach',
              duration: '4 hours',
              cost: 2000,
              location: 'Calangute',
              time: '09:00',
              category: 'beaches',
              bookingRequired: false,
            },
          ],
          meals: [
            {
              id: 'meal_1',
              name: 'Local Lunch',
              type: 'lunch',
              cost: 500,
              location: 'Calangute',
              time: '13:00',
              cuisine: 'Goan',
              description: 'Traditional Goan cuisine',
            },
          ],
          estimatedCost: 2500,
        },
      ],
      summary: 'A wonderful 5-day trip to Goa',
      highlights: ['Beach visits', 'Local cuisine', 'Water sports'],
      tips: ['Carry sunscreen', 'Book water sports in advance'],
      createdAt: '2024-01-01T00:00:00Z',
    }),
  },
}))

// Mock monitoring service
vi.mock('../lib/monitoring', () => ({
  monitoringService: {
    trackUserBehavior: vi.fn(),
    trackError: vi.fn(),
  },
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
}

describe('ItineraryGenerator Component', () => {
  it('renders AI Travel Planner interface', () => {
    render(
      <TestWrapper>
        <ItineraryGenerator />
      </TestWrapper>
    )

    expect(screen.getByText('AI Travel Planner')).toBeInTheDocument()
  })

  it('displays form fields', () => {
    render(
      <TestWrapper>
        <ItineraryGenerator />
      </TestWrapper>
    )

    expect(screen.getByPlaceholderText('e.g., Goa, Kerala, Rajasthan')).toBeInTheDocument()
  })
})
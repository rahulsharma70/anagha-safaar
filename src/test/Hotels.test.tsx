import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import Hotels from '../pages/Hotels'

// Mock the API services
vi.mock('../lib/api/travel', () => ({
  travelAPI: {
    searchHotels: vi.fn().mockResolvedValue([
      {
        id: '1',
        name: 'Test Hotel',
        price: 5000,
        starRating: 4,
        location: {
          city: 'Delhi',
          country: 'India',
        },
        images: ['https://example.com/hotel.jpg'],
      },
    ]),
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

describe('Hotels Page', () => {
  it('renders hotels page with title', async () => {
    render(
      <TestWrapper>
        <Hotels />
      </TestWrapper>
    )

    expect(screen.getByText('Luxury Hotels')).toBeInTheDocument()
  })

  it('displays search form', () => {
    render(
      <TestWrapper>
        <Hotels />
      </TestWrapper>
    )

    expect(screen.getByPlaceholderText('City or Airport Code (e.g., DEL, BOM)')).toBeInTheDocument()
  })
})
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import Flights from '../pages/Flights'

// Mock the API services
vi.mock('../lib/api/travel', () => ({
  travelAPI: {
    searchFlights: vi.fn().mockResolvedValue([
      {
        id: '1',
        airline: 'Air India',
        flightNumber: 'AI101',
        departure: {
          city: 'DEL',
          time: '2024-01-15T10:00:00Z',
        },
        arrival: {
          city: 'BOM',
          time: '2024-01-15T12:30:00Z',
        },
        price: 8000,
        travelClass: 'ECONOMY',
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

describe('Flights Page', () => {
  it('renders flights page with title', async () => {
    render(
      <TestWrapper>
        <Flights />
      </TestWrapper>
    )

    expect(screen.getByText('Flight Bookings')).toBeInTheDocument()
  })

  it('displays flight search form', () => {
    render(
      <TestWrapper>
        <Flights />
      </TestWrapper>
    )

    expect(screen.getByPlaceholderText('From (e.g., DEL)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('To (e.g., BOM)')).toBeInTheDocument()
  })
})
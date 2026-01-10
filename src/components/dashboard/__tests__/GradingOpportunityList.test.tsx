import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GradingOpportunityList from '../GradingOpportunityList'
import type { GradingOpportunity } from '@/types/grading-opportunity'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock the useBreakpoint hook
vi.mock('@/hooks/useIsDesktop', () => ({
  useBreakpoint: () => ({
    sm: true,
    md: true,
    lg: true,
    xl: true,
    '2xl': true,
  }),
}))

const mockOpportunities: GradingOpportunity[] = [
  {
    collectionCardId: 'collection-1',
    pokemonCardId: 'card-1',
    cardName: 'Charizard ex',
    setName: 'Obsidian Flames',
    imageUrl: '/test-image-1.jpg',
    frontImageUrl: '/front-1.jpg',
    backImageUrl: '/back-1.jpg',
    currentMarketPrice: 45.99,
    profitAtPsa10: 150,
    profitAtPsa9: 25,
    roiPsa10: 125,
    gradingSafetyTier: 'SAFE_BET',
    gradingFeeEntry: 25,
    gradingFeePsa10: 25,
    gradingFeePsa9: 25,
    psa10Price: 220,
    psa9Price: 95,
  },
  {
    collectionCardId: 'collection-2',
    pokemonCardId: 'card-2',
    cardName: 'Pikachu VMAX',
    setName: 'Vivid Voltage',
    imageUrl: '/test-image-2.jpg',
    frontImageUrl: '/front-2.jpg',
    backImageUrl: '/back-2.jpg',
    currentMarketPrice: 30.0,
    profitAtPsa10: 100,
    profitAtPsa9: null,
    roiPsa10: 150,
    gradingSafetyTier: 'GAMBLE',
    gradingFeeEntry: 19.99,
    gradingFeePsa10: 19.99,
    gradingFeePsa9: null,
    psa10Price: 150,
    psa9Price: null,
  },
]

describe('GradingOpportunityList', () => {
  it('renders all opportunities', () => {
    render(<GradingOpportunityList opportunities={mockOpportunities} />)

    expect(screen.getByText('Charizard ex')).toBeInTheDocument()
    expect(screen.getByText('Pikachu VMAX')).toBeInTheDocument()
  })

  it('renders correct number of rows', () => {
    render(<GradingOpportunityList opportunities={mockOpportunities} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
  })

  it('opens modal when row is clicked', () => {
    render(<GradingOpportunityList opportunities={mockOpportunities} />)

    // Click first row
    const firstRow = screen.getByText('Charizard ex').closest('button')
    fireEvent.click(firstRow!)

    // Modal should now be visible with grading analysis title
    expect(screen.getByText('Grading Analysis')).toBeInTheDocument()
    // Card name should appear in modal
    expect(screen.getAllByText('Charizard ex')).toHaveLength(2) // One in row, one in modal
  })

  it('shows safety tier badge in modal', () => {
    render(<GradingOpportunityList opportunities={mockOpportunities} />)

    // Click first row (SAFE_BET)
    const firstRow = screen.getByText('Charizard ex').closest('button')
    fireEvent.click(firstRow!)

    expect(screen.getByText('Safe Bet')).toBeInTheDocument()
  })

  it('closes modal when close button is clicked', () => {
    render(<GradingOpportunityList opportunities={mockOpportunities} />)

    // Open modal
    const firstRow = screen.getByText('Charizard ex').closest('button')
    fireEvent.click(firstRow!)

    // Verify modal is open
    expect(screen.getByText('Grading Analysis')).toBeInTheDocument()

    // Close modal
    const closeButton = screen.getByLabelText('Close')
    fireEvent.click(closeButton)

    // Modal should be closed
    expect(screen.queryByText('Grading Analysis')).not.toBeInTheDocument()
  })

  it('handles empty opportunities array', () => {
    const { container } = render(<GradingOpportunityList opportunities={[]} />)

    // Should render the container but with no rows
    expect(container.querySelector('.divide-y')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows disclaimers in modal', () => {
    render(<GradingOpportunityList opportunities={mockOpportunities} />)

    // Open modal
    const firstRow = screen.getByText('Charizard ex').closest('button')
    fireEvent.click(firstRow!)

    expect(screen.getByText('Important Disclaimers')).toBeInTheDocument()
    expect(
      screen.getByText('AI grading results do not guarantee actual PSA grade')
    ).toBeInTheDocument()
  })

  it('shows Start AI Pre-Grade button in modal', () => {
    render(<GradingOpportunityList opportunities={mockOpportunities} />)

    // Open modal
    const firstRow = screen.getByText('Charizard ex').closest('button')
    fireEvent.click(firstRow!)

    expect(screen.getByText('Start AI Pre-Grade')).toBeInTheDocument()
  })
})

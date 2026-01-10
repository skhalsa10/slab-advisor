import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GradingOpportunityRow from '../GradingOpportunityRow'
import type { GradingOpportunity } from '@/types/grading-opportunity'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

const mockOpportunity: GradingOpportunity = {
  collectionCardId: 'collection-123',
  pokemonCardId: 'card-456',
  cardName: 'Charizard ex',
  setName: 'Obsidian Flames',
  imageUrl: '/test-image.jpg',
  frontImageUrl: '/front.jpg',
  backImageUrl: '/back.jpg',
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
}

describe('GradingOpportunityRow', () => {
  it('renders card name and raw price', () => {
    const onClick = vi.fn()
    render(<GradingOpportunityRow opportunity={mockOpportunity} onClick={onClick} />)

    expect(screen.getByText('Charizard ex')).toBeInTheDocument()
    expect(screen.getByText('Raw: $45.99')).toBeInTheDocument()
  })

  it('renders PSA 10 profit with + prefix', () => {
    const onClick = vi.fn()
    render(<GradingOpportunityRow opportunity={mockOpportunity} onClick={onClick} />)

    expect(screen.getByText('PSA 10: +$150')).toBeInTheDocument()
  })

  it('renders PSA 9 profit when available', () => {
    const onClick = vi.fn()
    render(<GradingOpportunityRow opportunity={mockOpportunity} onClick={onClick} />)

    expect(screen.getByText('PSA 9: +$25')).toBeInTheDocument()
  })

  it('does not render PSA 9 when null', () => {
    const onClick = vi.fn()
    const opportunityNoPsa9 = { ...mockOpportunity, profitAtPsa9: null }
    render(<GradingOpportunityRow opportunity={opportunityNoPsa9} onClick={onClick} />)

    expect(screen.queryByText(/PSA 9:/)).not.toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<GradingOpportunityRow opportunity={mockOpportunity} onClick={onClick} />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders card image with correct alt text', () => {
    const onClick = vi.fn()
    render(<GradingOpportunityRow opportunity={mockOpportunity} onClick={onClick} />)

    const img = screen.getByAltText('Charizard ex')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/test-image.jpg')
  })

  it('formats large profit values with k suffix', () => {
    const onClick = vi.fn()
    const highProfitOpportunity = { ...mockOpportunity, profitAtPsa10: 1500 }
    render(<GradingOpportunityRow opportunity={highProfitOpportunity} onClick={onClick} />)

    expect(screen.getByText('PSA 10: +$1.5k')).toBeInTheDocument()
  })

  it('handles negative PSA 9 profit', () => {
    const onClick = vi.fn()
    const negativePsa9 = { ...mockOpportunity, profitAtPsa9: -15 }
    render(<GradingOpportunityRow opportunity={negativePsa9} onClick={onClick} />)

    expect(screen.getByText('PSA 9: -$15')).toBeInTheDocument()
  })
})

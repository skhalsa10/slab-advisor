import { render, screen, fireEvent } from '@/utils/test-utils'
import CardImageDisplay from './CardImageDisplay'
import { Card } from '@/types/database'

const mockCard: Card = {
  id: '1',
  user_id: 'user1',
  front_image_url: 'https://example.com/front.jpg',
  back_image_url: 'https://example.com/back.jpg',
  front_full_overlay_url: 'https://example.com/front-full.jpg',
  front_exact_overlay_url: 'https://example.com/front-exact.jpg',
  back_full_overlay_url: 'https://example.com/back-full.jpg',
  back_exact_overlay_url: 'https://example.com/back-exact.jpg',
  card_title: 'Test Card',
  estimated_grade: 9,
  confidence: 0.95,
  grading_details: null,
  ungraded_price: null,
  graded_prices: null,
  price_date: null,
  card_set: null,
  rarity: null,
  out_of: null,
  card_number: null,
  set_series_code: null,
  set_code: null,
  series: null,
  year: null,
  subcategory: null,
  links: null,
  analyze_details: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

describe('CardImageDisplay', () => {
  it('renders front and back image sections', () => {
    render(<CardImageDisplay card={mockCard} />)
    
    expect(screen.getByText('Front')).toBeInTheDocument()
    expect(screen.getByText('Back')).toBeInTheDocument()
  })

  it('renders original images by default', () => {
    render(<CardImageDisplay card={mockCard} />)
    
    const frontImage = screen.getByAltText('Test Card - Front')
    const backImage = screen.getByAltText('Test Card - Back')
    
    // Next.js Image component transforms the src URL
    expect(frontImage).toHaveAttribute('src', expect.stringContaining('https%3A%2F%2Fexample.com%2Ffront.jpg'))
    expect(backImage).toHaveAttribute('src', expect.stringContaining('https%3A%2F%2Fexample.com%2Fback.jpg'))
  })

  it('switches to overlay images when buttons are clicked', () => {
    render(<CardImageDisplay card={mockCard} />)
    
    // Click Full overlay button for front image
    const frontFullButton = screen.getAllByText('Full')[0]
    fireEvent.click(frontFullButton)
    
    const frontImage = screen.getByAltText('Test Card - Front')
    expect(frontImage).toHaveAttribute('src', expect.stringContaining('https%3A%2F%2Fexample.com%2Ffront-full.jpg'))
  })

  it('shows placeholder when no images are available', () => {
    const cardWithoutImages: Card = {
      ...mockCard,
      front_image_url: null,
      back_image_url: null,
      front_full_overlay_url: null,
      front_exact_overlay_url: null,
      back_full_overlay_url: null,
      back_exact_overlay_url: null
    }
    
    render(<CardImageDisplay card={cardWithoutImages} />)
    
    expect(screen.getByText('No front image')).toBeInTheDocument()
    expect(screen.getByText('No back image')).toBeInTheDocument()
  })

  it('only shows overlay buttons when overlay images exist', () => {
    const cardWithLimitedOverlays: Card = {
      ...mockCard,
      front_full_overlay_url: null,
      front_exact_overlay_url: null,
      back_full_overlay_url: null,
      back_exact_overlay_url: null
    }
    
    render(<CardImageDisplay card={cardWithLimitedOverlays} />)
    
    // Should only show Original buttons, no overlay buttons
    const originalButtons = screen.getAllByText('Original')
    const fullButtons = screen.queryAllByText('Full')
    const exactButtons = screen.queryAllByText('Exact')
    
    expect(originalButtons).toHaveLength(2) // Front and back
    expect(fullButtons).toHaveLength(0)
    expect(exactButtons).toHaveLength(0)
  })
})
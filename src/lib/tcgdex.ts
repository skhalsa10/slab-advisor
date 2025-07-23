import TCGdex from '@tcgdex/sdk'
import type { Set, Serie, Card } from '@tcgdex/sdk'

// Initialize TCGdex SDK with English language
const tcgdex = new TCGdex('en')

// Note: TCGDex SDK handles caching internally
// We can implement additional caching at the application level if needed

export interface SerieWithSets extends Serie {
  sets: Set[]
}

export interface SetWithCards extends Set {
  cards: Card[]
}

export interface CardBrief {
  id: string
  localId: string | number
  name: string
  image?: string
  rarity?: string
  category: string
}

export type CardFull = Card

/**
 * Fetch all series with their sets
 */
export async function getAllSeriesWithSets(): Promise<SerieWithSets[]> {
  try {
    const series = await tcgdex.fetch('series')
    
    if (!series) {
      throw new Error('No series data received')
    }
    
    // Fetch full serie data for each to get sets
    const seriesWithSets = await Promise.all(
      series.map(async (serie) => {
        const fullSerie = await tcgdex.fetch('series', serie.id)
        return fullSerie as SerieWithSets
      })
    )
    
    return seriesWithSets
  } catch (error) {
    console.error('Error fetching series:', error)
    throw new Error('Failed to fetch Pokemon series')
  }
}

/**
 * Fetch a specific set with all its cards
 */
export async function getSetWithCards(setId: string): Promise<SetWithCards> {
  try {
    const set = await tcgdex.fetch('sets', setId)
    if (!set) {
      throw new Error('Set not found')
    }
    return set as SetWithCards
  } catch (error) {
    console.error('Error fetching set:', error)
    throw new Error(`Failed to fetch set: ${setId}`)
  }
}

/**
 * Fetch a specific card
 */
export async function getCard(cardId: string): Promise<CardFull> {
  try {
    const card = await tcgdex.fetch('cards', cardId)
    if (!card) {
      throw new Error('Card not found')
    }
    return card as CardFull
  } catch (error) {
    console.error('Error fetching card:', error)
    throw new Error(`Failed to fetch card: ${cardId}`)
  }
}

/**
 * Search for sets by name
 */
export function searchSets(sets: Set[], query: string): Set[] {
  const lowercaseQuery = query.toLowerCase()
  return sets.filter(set => 
    set.name.toLowerCase().includes(lowercaseQuery) ||
    set.id.toLowerCase().includes(lowercaseQuery)
  )
}

/**
 * Search for cards by name or number
 */
export function searchCards(cards: CardBrief[], query: string): CardBrief[] {
  const lowercaseQuery = query.toLowerCase()
  return cards.filter(card => 
    card.name.toLowerCase().includes(lowercaseQuery) ||
    card.localId.toString().includes(lowercaseQuery)
  )
}

/**
 * Get image URL with specific quality
 */
export function getCardImageUrl(imageUrl: string | undefined, quality: 'low' | 'high' = 'low'): string {
  if (!imageUrl) return '/card-placeholder.svg'
  
  // TCGdex images support different qualities by appending to the URL
  return `${imageUrl}/${quality}.webp`
}

/**
 * Get logo URL with specific format
 */
export function getLogoUrl(logoUrl: string | undefined, format: 'png' | 'webp' = 'png'): string {
  if (!logoUrl) return '/placeholder-logo.png'
  
  return `${logoUrl}.${format}`
}
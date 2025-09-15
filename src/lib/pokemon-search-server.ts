/**
 * Pokemon Search Server module for Slab Advisor
 * 
 * This module provides SERVER-ONLY search operations for Pokemon TCG cards.
 * It uses service role client for secure server-side access with intelligent query parsing.
 * 
 * IMPORTANT: This file should ONLY be imported in Server Components or API routes.
 * Importing this in Client Components will cause build errors.
 * 
 * @module pokemon-search-server
 */

import { getServerSupabaseClient } from './supabase-server'

export interface PokemonSearchResult {
  id: string
  name: string
  local_id: string | null
  image: string | null
  tcgplayer_image_url: string | null
  rarity: string | null
  set_name: string
  set_id: string
}

interface DatabaseCardResult {
  id: string
  name: string
  local_id: string | null
  image: string | null
  tcgplayer_image_url: string | null
  rarity: string | null
  set_id: string
  pokemon_sets: {
    name: string
  }
}

interface ParsedQuery {
  type: 'structured' | 'exactId' | 'nameAndNumber' | 'complex' | 'general'
  cardName?: string
  cardNumber?: string  // Can be "181" or "181/210"
  setName?: string
  rawQuery?: string    // For general fallback
}

/**
 * Parse search query to detect patterns
 * 
 * Priority order:
 * 1. Structured format: name:"pikachu" id:"181" set:"stellar crown"
 * 2. Exact ID: #181
 * 3. Name + Number: pikachu 181 or pikachu 181/210
 * 4. Complex: combinations with set names
 * 5. General: fuzzy search fallback
 * 
 * @param query - Raw search query from user
 * @returns Parsed query with detected pattern type
 */
function parseSearchQuery(query: string): ParsedQuery {
  const trimmed = query.trim()
  
  // First, check for structured format (name:"" id:"" set:"")
  const structuredPattern = /(?:name|id|set):"[^"]*"/gi
  const hasStructured = structuredPattern.test(trimmed)
  
  if (hasStructured) {
    // Extract structured fields
    const nameMatch = trimmed.match(/name:"([^"]*)"/i)
    const idMatch = trimmed.match(/id:"([^"]*)"/i)
    const setMatch = trimmed.match(/set:"([^"]*)"/i)
    
    return {
      type: 'structured',
      cardName: nameMatch ? nameMatch[1] : undefined,
      cardNumber: idMatch ? idMatch[1] : undefined,
      setName: setMatch ? setMatch[1] : undefined
    }
  }
  
  // Extract card number patterns (181, #181, 181/210, #181/210)
  const numberPattern = /#?(\d+(?:\/\d+)?)/g
  const numbers = [...trimmed.matchAll(numberPattern)]
  
  // Create a version without number patterns for text analysis
  const textOnly = trimmed.replace(numberPattern, ' ').replace(/\s+/g, ' ').trim()
  
  // If query is ONLY a number (with or without #), treat as exact ID
  if (numbers.length === 1 && !textOnly) {
    return { 
      type: 'exactId', 
      cardNumber: numbers[0][1] 
    }
  }
  
  // Check for common set name patterns
  // This could be enhanced by loading actual set names from DB
  const setPatterns = [
    'stellar crown',
    'destined rivals', 
    'base set',
    'jungle',
    'fossil',
    'team rocket',
    'gym heroes',
    'gym challenge',
    'neo genesis',
    'neo discovery',
    'neo revelation',
    'neo destiny',
    'legendary collection',
    'expedition',
    'aquapolis',
    'skyridge'
  ]
  
  let detectedSet = ''
  let cardNameText = textOnly
  
  // Check if any set name is in the query
  for (const setName of setPatterns) {
    const regex = new RegExp(setName, 'gi')
    if (regex.test(textOnly)) {
      detectedSet = setName
      cardNameText = textOnly.replace(regex, '').replace(/\s+/g, ' ').trim()
      break
    }
  }
  
  // Extract card number if present
  const cardNumber = numbers.length > 0 ? numbers[0][1] : undefined
  
  // Determine query type based on what we found
  if (cardNameText && cardNumber && detectedSet) {
    // All three components found
    return { 
      type: 'complex', 
      cardName: cardNameText, 
      cardNumber, 
      setName: detectedSet 
    }
  } else if (cardNameText && cardNumber) {
    // Name and number (most common pattern)
    return { 
      type: 'nameAndNumber', 
      cardName: cardNameText, 
      cardNumber 
    }
  } else if (cardNumber && detectedSet && !cardNameText) {
    // Number and set, no name
    return { 
      type: 'complex', 
      cardNumber, 
      setName: detectedSet 
    }
  } else if (cardNameText && detectedSet) {
    // Name and set, no number
    return { 
      type: 'complex', 
      cardName: cardNameText, 
      setName: detectedSet 
    }
  }
  
  // Default to general search for anything else
  return { 
    type: 'general', 
    rawQuery: trimmed 
  }
}

/**
 * Search by exact local_id match
 * 
 * @param id - The exact local_id to search for (can include fraction like 181/210)
 * @param limit - Maximum number of results
 * @returns Array of matching cards
 */
async function searchByExactId(id: string, limit: number): Promise<PokemonSearchResult[]> {
  const supabase = getServerSupabaseClient()
  
  // Handle fractional IDs (181/210) by also searching for base number (181)
  const baseNumber = id.split('/')[0]
  
  const { data: cards, error } = await supabase
    .from('pokemon_cards')
    .select(`
      id,
      name,
      local_id,
      image,
      tcgplayer_image_url,
      rarity,
      set_id,
      pokemon_sets!inner(name)
    `)
    .in('local_id', [id, baseNumber])
    .limit(limit)
  
  if (error) {
    console.error('Error searching by exact ID:', error)
    throw new Error('Failed to search cards by ID')
  }
  
  return transformResults(cards || [])
}

/**
 * Search by name and number combination
 * 
 * @param name - Card name to search (partial match)
 * @param number - Card number/local_id to match (can include fraction)
 * @param limit - Maximum number of results
 * @returns Array of matching cards
 */
async function searchByNameAndNumber(
  name: string, 
  number: string, 
  limit: number
): Promise<PokemonSearchResult[]> {
  const supabase = getServerSupabaseClient()
  
  // Handle fractional IDs
  const baseNumber = number.split('/')[0]
  
  const { data: cards, error } = await supabase
    .from('pokemon_cards')
    .select(`
      id,
      name,
      local_id,
      image,
      tcgplayer_image_url,
      rarity,
      set_id,
      pokemon_sets!inner(name)
    `)
    .ilike('name', `%${name}%`)
    .in('local_id', [number, baseNumber])
    .limit(limit)
  
  if (error) {
    console.error('Error searching by name and number:', error)
    throw new Error('Failed to search cards by name and number')
  }
  
  return transformResults(cards || [])
}

/**
 * Complex search with multiple criteria
 * 
 * @param cardName - Optional card name (partial match)
 * @param cardNumber - Optional card number/local_id
 * @param setName - Optional set name (partial match)
 * @param limit - Maximum number of results
 * @returns Array of matching cards
 */
async function searchComplex(
  cardName?: string,
  cardNumber?: string,
  setName?: string,
  limit: number = 50
): Promise<PokemonSearchResult[]> {
  const supabase = getServerSupabaseClient()
  
  let query = supabase
    .from('pokemon_cards')
    .select(`
      id,
      name,
      local_id,
      image,
      tcgplayer_image_url,
      rarity,
      set_id,
      pokemon_sets!inner(name)
    `)
  
  // Apply filters based on what's provided
  if (cardName) {
    query = query.ilike('name', `%${cardName}%`)
  }
  
  if (cardNumber) {
    // Handle fractional IDs by searching for both formats
    const baseNumber = cardNumber.split('/')[0]
    if (cardNumber.includes('/')) {
      query = query.in('local_id', [cardNumber, baseNumber])
    } else {
      query = query.eq('local_id', cardNumber)
    }
  }
  
  if (setName) {
    query = query.ilike('pokemon_sets.name', `%${setName}%`)
  }
  
  const { data: cards, error } = await query
    .order('name')
    .limit(limit)
  
  if (error) {
    console.error('Error in complex search:', error)
    throw new Error('Failed to search cards with complex criteria')
  }
  
  return transformResults(cards || [])
}

/**
 * General fuzzy search across multiple fields
 * 
 * Searches:
 * - Card name
 * - Local ID
 * - Set name
 * 
 * @param query - Search query
 * @param limit - Maximum number of results
 * @returns Array of matching cards
 */
async function searchGeneralQuery(query: string, limit: number): Promise<PokemonSearchResult[]> {
  const supabase = getServerSupabaseClient()
  
  // Search cards by name or local_id, and also include set information
  const { data: cards, error } = await supabase
    .from('pokemon_cards')
    .select(`
      id,
      name,
      local_id,
      image,
      tcgplayer_image_url,
      rarity,
      set_id,
      pokemon_sets!inner(name)
    `)
    .or(`name.ilike.%${query}%,local_id.ilike.%${query}%`)
    .order('name')
    .limit(limit)
  
  if (error) {
    console.error('Error in general search:', error)
    throw new Error('Failed to search cards')
  }
  
  // Also search by set name if no results found
  let allResults = transformResults(cards || [])
  
  if (allResults.length < limit) {
    // Search for cards in sets that match the query
    const { data: setCards, error: setError } = await supabase
      .from('pokemon_cards')
      .select(`
        id,
        name,
        local_id,
        image,
        tcgplayer_image_url,
        rarity,
        set_id,
        pokemon_sets!inner(name)
      `)
      .ilike('pokemon_sets.name', `%${query}%`)
      .order('name')
      .limit(limit - allResults.length)
    
    if (setError) {
      console.error('Error in set search:', setError)
    } else {
      const setResults = transformResults(setCards || [])
      // Combine results and remove duplicates
      const existingIds = new Set(allResults.map(card => card.id))
      const newResults = setResults.filter(card => !existingIds.has(card.id))
      allResults = [...allResults, ...newResults]
    }
  }
  
  return allResults
}

/**
 * Transform database results to consistent format
 * 
 * @param cards - Raw database results
 * @returns Transformed results matching PokemonSearchResult interface
 */
function transformResults(cards: unknown[]): PokemonSearchResult[] {
  return (cards as DatabaseCardResult[]).map((card) => ({
    id: card.id,
    name: card.name,
    local_id: card.local_id,
    image: card.image,
    tcgplayer_image_url: card.tcgplayer_image_url,
    rarity: card.rarity,
    set_name: card.pokemon_sets?.name || 'Unknown Set',
    set_id: card.set_id
  }))
}

/**
 * Main intelligent search function (PUBLIC API)
 * 
 * Parses the query to detect patterns and routes to the appropriate
 * search method for optimal results.
 * 
 * Supports:
 * - Structured queries: name:"pikachu" id:"181" set:"stellar crown"
 * - Exact ID: #181 or #181/210
 * - Name + Number: pikachu 181
 * - Complex: pikachu 181 stellar crown
 * - General: fuzzy search fallback
 * 
 * @param query - User's search query
 * @param limit - Maximum number of results (default: 50)
 * @returns Promise containing array of matching cards
 * @throws Error if database query fails
 * 
 * @example
 * ```typescript
 * // Structured search
 * await searchPokemonCardsIntelligent('name:"pikachu" id:"25"', 50)
 * 
 * // Smart parsing
 * await searchPokemonCardsIntelligent('pikachu 025', 50)
 * await searchPokemonCardsIntelligent('#181/210', 50)
 * await searchPokemonCardsIntelligent('stellar crown charizard', 50)
 * ```
 */
export async function searchPokemonCardsIntelligent(
  query: string, 
  limit: number = 50
): Promise<PokemonSearchResult[]> {
  try {
    // Validate input
    if (!query || query.trim().length === 0) {
      return []
    }
    
    const trimmedQuery = query.trim()
    
    // Minimum query length for general searches (but allow structured or # queries)
    if (trimmedQuery.length < 2 && 
        !trimmedQuery.startsWith('#') && 
        !trimmedQuery.includes(':')) {
      return []
    }
    
    // Parse the query to detect pattern
    const parsed = parseSearchQuery(trimmedQuery)
    
    // Route to appropriate search method based on type
    switch (parsed.type) {
      case 'structured':
      case 'complex':
        // Both use the same complex search, just different parsing
        return await searchComplex(
          parsed.cardName,
          parsed.cardNumber,
          parsed.setName,
          limit
        )
        
      case 'exactId':
        if (parsed.cardNumber) {
          return await searchByExactId(parsed.cardNumber, limit)
        }
        break
        
      case 'nameAndNumber':
        if (parsed.cardName && parsed.cardNumber) {
          return await searchByNameAndNumber(
            parsed.cardName, 
            parsed.cardNumber, 
            limit
          )
        }
        break
        
      case 'general':
      default:
        if (parsed.rawQuery) {
          return await searchGeneralQuery(parsed.rawQuery, limit)
        }
    }
    
    return []
  } catch (error) {
    console.error('Error in searchPokemonCardsIntelligent:', error)
    throw new Error('Failed to search Pokemon cards')
  }
}
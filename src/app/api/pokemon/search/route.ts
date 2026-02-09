import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getUser } from '@/lib/auth-server'
import { searchPokemonCardsIntelligent, type PokemonSearchResult } from '@/lib/pokemon-search-server'


interface SearchResult extends PokemonSearchResult {
  card_type: 'pokemon'
}

/**
 * GET - Search Pokemon cards with intelligent parsing
 * 
 * Provides server-side search functionality with intelligent query parsing.
 * Supports structured queries, pattern recognition, and fuzzy search fallback.
 * Requires authentication to prevent abuse.
 * 
 * Query Parameters:
 * - q: Search query (required)
 * - limit: Maximum results (optional, default 50, max 100)
 * 
 * Supported Query Formats:
 * - Structured: name:"pikachu" id:"181" set:"stellar crown"
 * - Exact ID: #181 or #181/210
 * - Name + Number: pikachu 181
 * - Complex: pikachu 181 destined rivals
 * - General: pikachu (fuzzy search)
 * 
 * @example
 * GET /api/pokemon/search?q=pikachu%20181&limit=10
 * GET /api/pokemon/search?q=name:"charizard"%20set:"base%20set"
 */
export async function GET(request: Request) {
  const startTime = Date.now()
  try {
    // Require authentication
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limitParam = searchParams.get('limit')
    
    // Validate query parameter
    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        results: [],
        total: 0,
        query: '',
        limit: 0
      })
    }

    // Validate and parse limit
    let limit = 50 // Default limit
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10)
      if (parsedLimit > 0 && parsedLimit <= 100) {
        limit = parsedLimit
      }
    }

    // Minimum query length check (unless structured or exact ID)
    const trimmedQuery = query.trim()
    if (trimmedQuery.length < 2 && 
        !trimmedQuery.startsWith('#') && 
        !trimmedQuery.includes(':')) {
      return NextResponse.json({
        results: [],
        total: 0,
        query: trimmedQuery,
        limit,
        message: 'Query must be at least 2 characters long'
      })
    }

    // Perform intelligent search
    const pokemonResults = await Sentry.startSpan(
      {
        op: 'db.query',
        name: 'DB: Pokemon Search',
        attributes: { 'db.system': 'supabase', 'db.operation': 'search' }
      },
      async () => searchPokemonCardsIntelligent(trimmedQuery, limit)
    )
    
    // Add card_type field for frontend identification
    const results: SearchResult[] = pokemonResults.map(card => ({
      ...card,
      card_type: 'pokemon' as const
    }))

    // Sort results by name for consistency
    results.sort((a, b) => a.name.localeCompare(b.name))

    // Track search metrics
    Sentry.metrics.count('pokemon_searches', 1, {
      attributes: { has_results: results.length > 0 ? 'true' : 'false' }
    })
    Sentry.metrics.distribution('pokemon_search_latency', Date.now() - startTime, {
      unit: 'millisecond'
    })
    Sentry.metrics.distribution('pokemon_search_results', results.length)

    return NextResponse.json({
      results,
      total: results.length,
      query: trimmedQuery,
      limit
    })

  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: 'pokemon/search', operation: 'search_cards' }
    })
    Sentry.metrics.count('pokemon_searches', 1, {
      attributes: { has_results: 'error' }
    })
    Sentry.metrics.distribution('pokemon_search_latency', Date.now() - startTime, {
      unit: 'millisecond'
    })
    console.error('Pokemon search API error:', error)
    return NextResponse.json(
      { error: 'Failed to search cards' },
      { status: 500 }
    )
  }
}
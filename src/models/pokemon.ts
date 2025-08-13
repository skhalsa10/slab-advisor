import type { Database } from './database'

// Auto-generated types from Supabase
export type PokemonSeries = Database['public']['Tables']['pokemon_series']['Row']
export type PokemonSet = Database['public']['Tables']['pokemon_sets']['Row']
export type PokemonCard = Database['public']['Tables']['pokemon_cards']['Row']
export type PokemonProduct = Database['public']['Tables']['pokemon_products']['Row']

export type PokemonSeriesInsert = Database['public']['Tables']['pokemon_series']['Insert']
export type PokemonSetInsert = Database['public']['Tables']['pokemon_sets']['Insert']
export type PokemonCardInsert = Database['public']['Tables']['pokemon_cards']['Insert']
export type PokemonProductInsert = Database['public']['Tables']['pokemon_products']['Insert']

export type PokemonSeriesUpdate = Database['public']['Tables']['pokemon_series']['Update']
export type PokemonSetUpdate = Database['public']['Tables']['pokemon_sets']['Update']
export type PokemonCardUpdate = Database['public']['Tables']['pokemon_cards']['Update']
export type PokemonProductUpdate = Database['public']['Tables']['pokemon_products']['Update']

// Enhanced interfaces for query results with joins
export interface PokemonSeriesWithSets extends PokemonSeries {
  sets: PokemonSet[]
  setCount?: number
}

export interface PokemonSetWithCards extends PokemonSet {
  cards: PokemonCard[]
  series?: PokemonSeries
}

export interface PokemonSetWithProducts extends PokemonSet {
  products: PokemonProduct[]
  series?: PokemonSeries
}

export interface PokemonSetWithCardsAndProducts extends PokemonSetWithCards {
  products: PokemonProduct[]
}

export interface PokemonSetWithSeries extends PokemonSet {
  series: {
    id: string
    name: string
  }
}

export interface PokemonBrowseData {
  sets: PokemonSetWithSeries[]
  series: Array<{
    id: string
    name: string
  }>
}

export interface PokemonCardWithSet extends PokemonCard {
  set?: PokemonSet
}

// Search and pagination interfaces
export interface PokemonSearchParams {
  query?: string
  limit?: number
  offset?: number
}

export interface PokemonSeriesSearchParams extends PokemonSearchParams {
  includeSets?: boolean
}

export interface PokemonSetSearchParams extends PokemonSearchParams {
  seriesId?: string
  includeCards?: boolean
}

export interface PokemonCardSearchParams extends PokemonSearchParams {
  setId?: string
  category?: string
  rarity?: string
}

export interface PaginatedResult<T> {
  data: T[]
  count: number
  hasMore: boolean
  offset: number
  limit: number
}

// Filter interfaces
export interface PokemonSetFilters {
  seriesId?: string
  releaseYear?: number
  minCards?: number
  maxCards?: number
}

export interface PokemonCardFilters {
  setId?: string
  category?: 'Pokemon' | 'Trainer' | 'Energy'
  rarity?: string
  hasImage?: boolean
  variants?: {
    normal?: boolean
    reverse?: boolean
    holo?: boolean
    firstEdition?: boolean
  }
}

// TCGDx compatibility types (for easy migration)
export type SerieWithSets = PokemonSeriesWithSets
export type SetWithCards = PokemonSetWithCards
export type CardBrief = Pick<PokemonCard, 'id' | 'local_id' | 'name' | 'image' | 'rarity' | 'category'>
export type CardFull = PokemonCardWithSet
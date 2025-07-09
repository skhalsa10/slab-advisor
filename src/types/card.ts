/**
 * Card identification data structure
 */
export interface CardIdentificationData {
  card_set: string | null
  rarity: string | null
  full_name: string | null
  out_of: string | null
  card_number: string | null
  set_series_code: string | null
  set_code: string | null
  series: string | null
  year: number | null
  subcategory: string | null
  links: {
    'tcgplayer.com'?: string
    'ebay.com'?: string
  } | null
}
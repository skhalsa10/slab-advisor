/**
 * URL parameter keys for filter state persistence across navigation
 *
 * These constants define the URL query parameter names used to persist
 * filter state when navigating between browse, set detail, and card detail pages.
 */

// =============================================================================
// Browse Page Filters (/browse/pokemon)
// =============================================================================

/** Filter by Pokemon series */
export const BROWSE_PARAM_SERIES = 'series'

/** Search query for set names */
export const BROWSE_PARAM_SEARCH = 'q'

/** Sort order for sets (newest/oldest) */
export const BROWSE_PARAM_SORT = 'sort'

/** View mode for sets (grid/list) */
export const BROWSE_PARAM_VIEW = 'view'

/** All browse-level URL parameter keys */
export const BROWSE_FILTER_KEYS = [
  BROWSE_PARAM_SERIES,
  BROWSE_PARAM_SEARCH,
  BROWSE_PARAM_SORT,
  BROWSE_PARAM_VIEW,
] as const

// =============================================================================
// Set Detail Page Filters (/browse/pokemon/[setId])
// =============================================================================

/** Search query for cards within a set */
export const SET_PARAM_CARD_SEARCH = 'cs'

/** Sort order for cards (num_asc/num_desc/price_asc/price_desc) */
export const SET_PARAM_CARD_SORT = 'cso'

/** View mode for cards (grid/list) */
export const SET_PARAM_CARD_VIEW = 'cv'

/** Active tab (cards/products) */
export const SET_PARAM_CARD_TAB = 'ct'

/** Ownership filter (all/owned/missing) */
export const SET_PARAM_OWNERSHIP = 'co'

/** All set-detail-level URL parameter keys */
export const SET_FILTER_KEYS = [
  SET_PARAM_CARD_SEARCH,
  SET_PARAM_CARD_SORT,
  SET_PARAM_CARD_VIEW,
  SET_PARAM_CARD_TAB,
  SET_PARAM_OWNERSHIP,
] as const

// =============================================================================
// View Modes
// =============================================================================

export const VIEW_MODE_GRID = 'grid'
export const VIEW_MODE_LIST = 'list'

export type ViewModeValue = typeof VIEW_MODE_GRID | typeof VIEW_MODE_LIST

// =============================================================================
// Set Detail Tabs
// =============================================================================

export const TAB_CARDS = 'cards'
export const TAB_PRODUCTS = 'products'

export type SetDetailTabValue = typeof TAB_CARDS | typeof TAB_PRODUCTS

// =============================================================================
// Ownership Filter Options
// =============================================================================

export const OWNERSHIP_ALL = 'all'
export const OWNERSHIP_OWNED = 'owned'
export const OWNERSHIP_MISSING = 'missing'

export type OwnershipFilterValue =
  | typeof OWNERSHIP_ALL
  | typeof OWNERSHIP_OWNED
  | typeof OWNERSHIP_MISSING

// =============================================================================
// Browse Sort Options
// =============================================================================

export const BROWSE_SORT_NEWEST = 'newest'
export const BROWSE_SORT_OLDEST = 'oldest'

export type BrowseSortValue = typeof BROWSE_SORT_NEWEST | typeof BROWSE_SORT_OLDEST

// =============================================================================
// Set Detail Sort Options
// =============================================================================

export const CARD_SORT_NUM_ASC = 'num_asc'
export const CARD_SORT_NUM_DESC = 'num_desc'
export const CARD_SORT_PRICE_ASC = 'price_asc'
export const CARD_SORT_PRICE_DESC = 'price_desc'

export type CardSortValue =
  | typeof CARD_SORT_NUM_ASC
  | typeof CARD_SORT_NUM_DESC
  | typeof CARD_SORT_PRICE_ASC
  | typeof CARD_SORT_PRICE_DESC

// =============================================================================
// Default Values
// =============================================================================

export const BROWSE_DEFAULTS = {
  series: '',
  search: '',
  sort: BROWSE_SORT_NEWEST,
  view: VIEW_MODE_GRID,
} as const

export const SET_DEFAULTS = {
  cardSearch: '',
  cardSort: CARD_SORT_NUM_ASC,
  cardView: VIEW_MODE_GRID,
  cardTab: TAB_CARDS,
  cardOwnership: OWNERSHIP_ALL,
} as const

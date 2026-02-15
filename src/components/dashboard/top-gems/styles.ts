/**
 * Styling constants for the Top Gems Widget
 *
 * Provides consistent gold/silver/bronze visual theming
 * for the trophy-case style ranking display.
 */

/**
 * Rank style configuration
 */
export interface RankStyle {
  /** Background gradient class */
  bgGradient: string
  /** Border color class */
  borderColor: string
  /** Rank badge background gradient */
  rankBadgeBg: string
  /** Rank badge text color */
  rankBadgeText: string
}

/**
 * Styling constants for each rank position
 */
export const RANK_STYLES: Record<1 | 2 | 3, RankStyle> = {
  1: {
    // Gold
    bgGradient: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100',
    borderColor: 'border-amber-300',
    rankBadgeBg: 'bg-gradient-to-r from-amber-400 to-yellow-500',
    rankBadgeText: 'text-amber-900',
  },
  2: {
    // Silver
    bgGradient: 'bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100',
    borderColor: 'border-slate-300',
    rankBadgeBg: 'bg-gradient-to-r from-slate-400 to-gray-500',
    rankBadgeText: 'text-white',
  },
  3: {
    // Bronze
    bgGradient: 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100',
    borderColor: 'border-orange-300',
    rankBadgeBg: 'bg-gradient-to-r from-orange-400 to-amber-600',
    rankBadgeText: 'text-white',
  },
}

/**
 * Get styles for a given rank
 */
export function getRankStyle(rank: 1 | 2 | 3): RankStyle {
  return RANK_STYLES[rank]
}

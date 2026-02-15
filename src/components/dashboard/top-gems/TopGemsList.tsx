'use client'

/**
 * TopGemsList Component
 *
 * Displays the top gems in a compact horizontal grid.
 * Optimized for bento-box dashboard layout.
 */

import { PlusCircle } from 'lucide-react'
import Link from 'next/link'
import type { TopGem } from '@/types/top-gem'
import TopGemCard from './TopGemCard'
import { getRankStyle } from './styles'

interface TopGemsListProps {
  gems: TopGem[]
}

/**
 * Compact placeholder for empty gem slots
 */
function GemPlaceholder({ position }: { position: 2 | 3 }) {
  const style = getRankStyle(position)

  return (
    <div
      className={`
        flex flex-col items-center justify-center rounded-lg border border-dashed
        aspect-[2.5/3.5] p-3
        ${style.borderColor} bg-white/50
      `}
    >
      <div className="w-8 h-8 rounded-full bg-grey-100 flex items-center justify-center mb-1.5">
        <PlusCircle className="w-4 h-4 text-grey-400" />
      </div>
      <p className="text-xs text-grey-500 text-center">Add cards</p>
      <Link
        href="/collection/add"
        className="mt-1 text-[10px] text-orange-600 hover:text-orange-700 font-medium"
      >
        Add Card
      </Link>
    </div>
  )
}

export default function TopGemsList({ gems }: TopGemsListProps) {
  // Determine how many placeholders we need
  const placeholderCount = Math.max(0, 3 - gems.length)
  const placeholderPositions: (2 | 3)[] = []

  if (placeholderCount >= 1) placeholderPositions.push(2)
  if (placeholderCount >= 2) placeholderPositions.push(3)

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {/* Render gem cards */}
      {gems.map((gem, index) => (
        <TopGemCard key={gem.collectionCardId} gem={gem} priority={index === 0} />
      ))}

      {/* Render placeholders for remaining slots */}
      {placeholderPositions.map((position) => (
        <GemPlaceholder key={`placeholder-${position}`} position={position} />
      ))}
    </div>
  )
}

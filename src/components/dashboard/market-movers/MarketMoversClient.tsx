'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import HorizontalScroll from '@/components/widgets/HorizontalScroll'
import type { MarketMoverCard, MarketMoverPeriod } from '@/types/market-mover'
import { trackMarketMoversPeriodChanged } from '@/lib/posthog/events'

const PERIODS: { value: MarketMoverPeriod; label: string }[] = [
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
]

const DISPLAY_LIMIT = 10

/**
 * Gets the change value for a card based on the selected period.
 */
function getChangeForPeriod(
  card: MarketMoverCard,
  period: MarketMoverPeriod
): number | null {
  switch (period) {
    case '24h':
      return card.change24h
    case '7d':
      return card.change7d
    case '30d':
      return card.change30d
  }
}

/**
 * Formats a percentage change for display.
 * Returns the formatted string and color class.
 */
function formatChange(change: number): {
  text: string
  colorClass: string
  bgClass: string
} {
  const sign = change >= 0 ? '+' : ''
  const text = `${sign}${change.toFixed(1)}%`

  if (change > 0) {
    return { text, colorClass: 'text-green-700', bgClass: 'bg-green-50' }
  } else if (change < 0) {
    return { text, colorClass: 'text-red-700', bgClass: 'bg-red-50' }
  }
  return { text, colorClass: 'text-grey-500', bgClass: 'bg-grey-50' }
}

interface MarketMoversClientProps {
  cards: MarketMoverCard[]
}

export default function MarketMoversClient({ cards }: MarketMoversClientProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<MarketMoverPeriod>('7d')

  // Sort cards by absolute change for selected period, take top 5
  const sortedCards = useMemo(() => {
    return cards
      .filter((card) => {
        const change = getChangeForPeriod(card, selectedPeriod)
        return change !== null && change !== 0
      })
      .sort((a, b) => {
        const changeA = Math.abs(getChangeForPeriod(a, selectedPeriod) ?? 0)
        const changeB = Math.abs(getChangeForPeriod(b, selectedPeriod) ?? 0)
        return changeB - changeA
      })
      .slice(0, DISPLAY_LIMIT)
  }, [cards, selectedPeriod])

  const handlePeriodChange = (period: MarketMoverPeriod) => {
    setSelectedPeriod(period)
    trackMarketMoversPeriodChanged({ period })
  }

  return (
    <div>
      {/* Time period selector */}
      <div className="flex gap-1 mb-3">
        {PERIODS.map((period) => (
          <button
            key={period.value}
            onClick={() => handlePeriodChange(period.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              selectedPeriod === period.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Cards or empty state */}
      {sortedCards.length > 0 ? (
        <HorizontalScroll>
          {sortedCards.map((card) => {
            const change = getChangeForPeriod(card, selectedPeriod)!
            const { text, colorClass, bgClass } = formatChange(change)

            return (
              <div
                key={card.collectionCardId}
                className="flex-shrink-0 snap-start w-36 sm:w-40"
              >
                <Link
                  href={`/collection/cards/${card.collectionCardId}`}
                  className="group block bg-card text-card-foreground rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200"
                >
                  <div className="aspect-[2.5/3.5] relative">
                    <Image
                      src={card.imageUrl}
                      alt={card.cardName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 144px, 160px"
                      onError={(e) => {
                        e.currentTarget.src = '/card-placeholder.svg'
                      }}
                    />
                  </div>
                  <div className="p-2">
                    <h3 className="text-xs font-medium text-foreground truncate">
                      {card.cardName}
                    </h3>
                    <p
                      className={`text-xs font-medium ${colorClass} ${bgClass} inline-block px-1.5 py-0.5 rounded mt-0.5`}
                    >
                      {text}
                    </p>
                    <p className="text-base font-semibold text-foreground mt-1">
                      $
                      {card.currentPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </Link>
              </div>
            )
          })}
        </HorizontalScroll>
      ) : (
        <p className="text-sm text-grey-500 py-4 text-center">
          No significant market movement detected
        </p>
      )}
    </div>
  )
}

'use client'

import Link from 'next/link'
import Image from 'next/image'
import PriceDisplay from '@/components/ui/PriceDisplay'
import QuickAddButton from '@/components/collection/QuickAddButton'
import type { Json } from '@/models/database'

interface TCGCardProps {
  card: {
    id: string
    name: string
    image?: string
    fallbackImageUrl?: string
    metadata?: Array<{ label?: string; value: string }>
    priceData?: Json | null // JSONB price data from database
    price?: number | null // Simple price value (alternative to priceData)
  }
  href?: string
  onClick?: (e: React.MouseEvent, cardId: string) => void
  imageQuality?: 'low' | 'high'
  className?: string
  getImageUrl?: (image?: string, quality?: string, fallback?: string) => string
  // Quick Add props
  showQuickAdd?: boolean
  onQuickAdd?: (e: React.MouseEvent, cardId: string) => void
}

export default function TCGCard({
  card,
  href = '#',
  onClick,
  imageQuality = 'low',
  className = '',
  getImageUrl,
  showQuickAdd = false,
  onQuickAdd
}: TCGCardProps) {

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e, card.id)
    }
  }

  const handleQuickAdd = (e: React.MouseEvent) => {
    if (onQuickAdd) {
      onQuickAdd(e, card.id)
    }
  }

  // Use provided getImageUrl function or fallback to basic logic
  const imageUrl = getImageUrl 
    ? getImageUrl(card.image, imageQuality, card.fallbackImageUrl)
    : card.image || card.fallbackImageUrl || '/card-placeholder.svg'


  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`group relative bg-white rounded-lg overflow-hidden border border-grey-200 hover:border-orange-300 hover:shadow-lg transition-all duration-200 cursor-pointer ${className}`}
    >
      <div className="aspect-[2.5/3.5] relative">
        <Image
          src={imageUrl}
          alt={card.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          onError={(e) => {
            e.currentTarget.src = '/card-placeholder.svg'
          }}
        />
        {/* Quick Add Button - always visible on touch devices, hover-reveal on devices with mouse */}
        {showQuickAdd && (
          <div className="absolute bottom-2 right-2 z-10 touch:flex can-hover:hidden can-hover:group-hover:flex">
            <QuickAddButton onClick={handleQuickAdd} />
          </div>
        )}
      </div>
      <div className="p-2">
        <h3 className="text-xs font-medium text-grey-900 truncate">
          {card.name}
        </h3>
        {card.metadata && card.metadata.length > 0 && (
          <p className="text-xs text-grey-600">
            {card.metadata.map((item, index) => (
              <span key={index}>
                {item.label && `${item.label}: `}{item.value}
                {index < card.metadata!.length - 1 && ' • '}
              </span>
            ))}
          </p>
        )}
        {card.priceData ? (
          <PriceDisplay
            priceData={card.priceData}
            showMarketLabel={false}
            className="mt-1"
          />
        ) : card.price != null ? (
          <p className="text-base font-semibold text-gray-900 mt-1">
            ${card.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        ) : null}
      </div>
    </Link>
  )
}
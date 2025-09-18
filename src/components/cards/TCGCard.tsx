import Link from 'next/link'
import Image from 'next/image'
import PriceDisplay from '@/components/ui/PriceDisplay'

interface TCGCardProps {
  card: {
    id: string
    name: string
    image?: string
    fallbackImageUrl?: string
    metadata?: Array<{ label?: string; value: string }>
    priceData?: Record<string, unknown> | null // JSONB price data from database
  }
  href?: string
  onClick?: (e: React.MouseEvent, cardId: string) => void
  imageQuality?: 'low' | 'high'
  className?: string
  getImageUrl?: (image?: string, quality?: string, fallback?: string) => string
}

export default function TCGCard({
  card,
  href = '#',
  onClick,
  imageQuality = 'low',
  className = '',
  getImageUrl
}: TCGCardProps) {
  
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e, card.id)
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
        <PriceDisplay
          priceData={card.priceData}
          showMarketLabel={false}
          className="mt-1"
        />
      </div>
    </Link>
  )
}
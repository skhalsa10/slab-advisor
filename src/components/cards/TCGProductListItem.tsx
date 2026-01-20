'use client'

import Image from 'next/image'
import SimplePriceDisplay from '@/components/ui/SimplePriceDisplay'
import QuickAddButton from '@/components/collection/QuickAddButton'

interface TCGProductListItemProps {
  product: {
    id: string
    name: string
    tcgplayer_product_id?: string | number
    tcgplayer_image_url?: string
    image?: string
    current_market_price?: number | null
  }
  href?: string
  target?: '_blank' | '_self'
  // Click handler - when provided, clicking row opens quickview instead of navigating
  onClick?: (e: React.MouseEvent, productId: string) => void
  // Quick Add props
  showQuickAdd?: boolean
  onQuickAdd?: (e: React.MouseEvent, productId: string) => void
}

export default function TCGProductListItem({
  product,
  href,
  target = '_blank',
  onClick,
  showQuickAdd = false,
  onQuickAdd
}: TCGProductListItemProps) {

  // Determine the link URL (used only when no onClick handler)
  const productHref = href ||
    (product.tcgplayer_product_id ? `https://www.tcgplayer.com/product/${product.tcgplayer_product_id}` : '#')

  const imageUrl = product.tcgplayer_image_url || product.image

  const handleRowClick = (e: React.MouseEvent) => {
    if (onClick) {
      // Only trigger if not clicking on the shop link
      const target = e.target as HTMLElement
      if (!target.closest('a[href]')) {
        e.preventDefault()
        onClick(e, product.id)
      }
    }
  }

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onQuickAdd) {
      onQuickAdd(e, product.id)
    }
  }

  return (
    <tr
      className={`hover:bg-grey-50 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick ? handleRowClick : undefined}
    >
      {/* Quick Add Column */}
      {showQuickAdd && (
        <td className="px-4 py-4 whitespace-nowrap">
          <QuickAddButton onClick={handleQuickAdd} />
        </td>
      )}

      {/* Product Info */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.name}
                width={48}
                height={48}
                className="h-12 w-12 object-contain rounded-md border border-grey-200"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="h-12 w-12 rounded-md bg-grey-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-grey-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-grey-900">
              {product.name}
            </div>
            <div className="text-sm text-grey-500">
              Product #{product.tcgplayer_product_id || 'N/A'}
            </div>
          </div>
        </div>
      </td>

      {/* Price */}
      <td className="px-6 py-4 whitespace-nowrap">
        <SimplePriceDisplay
          price={product.current_market_price}
          showMarketLabel={false}
        />
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <a
          href={productHref}
          target={target}
          rel="noopener noreferrer"
          className="text-orange-600 hover:text-orange-900 transition-colors inline-flex items-center"
          onClick={(e) => e.stopPropagation()} // Don't trigger row click
        >
          Shop on TCGPlayer
          <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </td>
    </tr>
  )
}

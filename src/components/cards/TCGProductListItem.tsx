import Image from 'next/image'
import PriceDisplay from '@/components/ui/PriceDisplay'

interface TCGProductListItemProps {
  product: {
    id: string
    name: string
    tcgplayer_product_id?: string | number
    tcgplayer_image_url?: string
    image?: string
    price_data?: Record<string, unknown> | null
  }
  href?: string
  target?: '_blank' | '_self'
}

export default function TCGProductListItem({
  product,
  href,
  target = '_blank'
}: TCGProductListItemProps) {

  // Determine the link URL
  const productHref = href ||
    (product.tcgplayer_product_id ? `https://www.tcgplayer.com/product/${product.tcgplayer_product_id}` : '#')

  const imageUrl = product.tcgplayer_image_url || product.image


  return (
    <tr className="hover:bg-grey-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <a href={productHref} target={target} rel="noopener noreferrer" className="flex items-center">
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
        </a>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <PriceDisplay
          priceData={product.price_data}
          showMarketLabel={false}
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <a
          href={productHref}
          target={target}
          rel="noopener noreferrer"
          className="text-orange-600 hover:text-orange-900 transition-colors inline-flex items-center"
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
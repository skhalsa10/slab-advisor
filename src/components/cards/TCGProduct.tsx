import Image from 'next/image'

interface TCGProductProps {
  product: {
    id: string
    name: string
    tcgplayer_product_id?: string | number
    tcgplayer_image_url?: string
    image?: string
  }
  href?: string
  shopLinkText?: string
  className?: string
  target?: '_blank' | '_self'
  rel?: string
}

export default function TCGProduct({
  product,
  href,
  shopLinkText = 'Shop on TCGPlayer',
  className = '',
  target = '_blank',
  rel = 'noopener noreferrer'
}: TCGProductProps) {
  
  // Determine the link URL
  const productHref = href || 
    (product.tcgplayer_product_id ? `https://www.tcgplayer.com/product/${product.tcgplayer_product_id}` : '#')

  const imageUrl = product.tcgplayer_image_url || product.image

  return (
    <a
      href={productHref}
      target={target}
      rel={rel}
      className={`group relative bg-white rounded-lg overflow-hidden border border-grey-200 hover:border-orange-300 hover:shadow-lg transition-all duration-200 ${className}`}
    >
      <div className="aspect-[2.5/3.5] relative bg-grey-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const parent = e.currentTarget.parentElement
              if (parent) {
                parent.innerHTML = '<div class="flex items-center justify-center h-full text-grey-400"><svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>'
              }
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-grey-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-grey-900 line-clamp-2">
          {product.name}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-grey-600">{shopLinkText}</span>
          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
      </div>
    </a>
  )
}
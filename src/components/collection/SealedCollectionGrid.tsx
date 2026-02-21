'use client'

import ItemGrid from '@/components/ui/ItemGrid'
import SealedProductGridItem from './SealedProductGridItem'
import EmptySealedState from './EmptySealedState'
import { type CollectionProductWithPriceChanges } from '@/utils/collectionProductUtils'

interface SealedCollectionGridProps {
  products: CollectionProductWithPriceChanges[]
  onViewProduct: (product: CollectionProductWithPriceChanges) => void
  isSelectionMode?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (productId: string) => void
}

/**
 * Sealed Collection Grid Component
 *
 * Displays a grid of sealed products in the user's collection.
 * Uses the same grid layout as the card collection for consistency.
 */
export default function SealedCollectionGrid({
  products,
  onViewProduct,
  isSelectionMode = false,
  selectedIds,
  onToggleSelect
}: SealedCollectionGridProps) {
  if (products.length === 0) {
    return <EmptySealedState />
  }

  return (
    <ItemGrid
      items={products}
      renderItem={(product, index) => (
        <SealedProductGridItem
          key={product.id}
          product={product}
          onViewProduct={() => onViewProduct(product)}
          priority={index < 8}
          isSelectionMode={isSelectionMode}
          isSelected={selectedIds?.has(product.id) ?? false}
          onToggleSelect={() => onToggleSelect?.(product.id)}
        />
      )}
      emptyStateComponent={<EmptySealedState />}
      columns={{
        base: 2,
        sm: 3,
        md: 4,
        lg: 4,
        xl: 5,
        '2xl': 5
      }}
    />
  )
}

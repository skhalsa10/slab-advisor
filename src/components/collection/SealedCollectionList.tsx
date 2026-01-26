'use client'

import { type CollectionProductWithPriceChanges } from '@/utils/collectionProductUtils'
import ItemList from '@/components/ui/ItemList'
import SealedProductListItem from './SealedProductListItem'
import EmptyCollectionState from './EmptyCollectionState'

interface SealedCollectionListProps {
  products: CollectionProductWithPriceChanges[]
  onViewProduct: (product: CollectionProductWithPriceChanges) => void
}

/**
 * Sealed Collection List Component
 *
 * Displays sealed products in a table/spreadsheet view with financial metrics.
 * Uses responsive design - Market Trend column hidden on mobile.
 */
export default function SealedCollectionList({
  products,
  onViewProduct
}: SealedCollectionListProps) {
  return (
    <ItemList
      items={products}
      renderHeader={() => (
        <tr>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider"
          >
            Product
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider"
          >
            Condition
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-center text-xs font-medium text-grey-500 uppercase tracking-wider"
          >
            Qty
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wider"
          >
            Cost Basis
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wider"
          >
            Market
          </th>
          <th
            scope="col"
            className="hidden md:table-cell px-6 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wider"
          >
            Trend (7d)
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wider"
          >
            Total
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wider"
          >
            Gain/Loss
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider"
          >
            Actions
          </th>
        </tr>
      )}
      renderRow={(product) => (
        <SealedProductListItem
          key={product.id}
          product={product}
          onViewProduct={() => onViewProduct(product)}
        />
      )}
      emptyStateComponent={<EmptyCollectionState />}
    />
  )
}

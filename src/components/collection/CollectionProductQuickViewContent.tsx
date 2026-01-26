'use client'

import { useState } from 'react'
import Image from 'next/image'
import EditProductForm from '@/components/collection/EditProductForm'
import DeleteProductDialog from '@/components/collection/DeleteProductDialog'
import type { CollectionProduct } from '@/types/database'
import {
  type CollectionProductWithPriceChanges,
  getProductDisplayName,
  getProductImageUrl,
  getProductSetName,
  getProductMarketPrice,
  getProductTotalValue,
  formatProductCondition
} from '@/utils/collectionProductUtils'

interface CollectionProductQuickViewContentProps {
  product: CollectionProductWithPriceChanges
  onUpdate?: (updatedProduct: CollectionProductWithPriceChanges) => void
  onDelete?: () => void
  onClose?: () => void
}

/**
 * CollectionProductQuickViewContent Component
 *
 * Displays collection product details with edit/delete actions.
 * This component focuses on content only - layout is handled by QuickView wrapper.
 * Used in the collection page for viewing and managing sealed products.
 */
export default function CollectionProductQuickViewContent({
  product,
  onUpdate,
  onDelete,
  onClose
}: CollectionProductQuickViewContentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDeleteProduct = async () => {
    try {
      const response = await fetch(`/api/collection/products/${product.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage =
          errorData.error || `Failed to delete product (${response.status})`
        console.error('Delete product error:', errorMessage, errorData)
        throw new Error(errorMessage)
      }

      setShowDeleteDialog(false)
      onDelete?.()
      onClose?.()
    } catch (error) {
      console.error('Error deleting product:', error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to delete product from collection'
      )
      setShowDeleteDialog(false)
    }
  }

  const handleSaveProduct = async (updates: Partial<CollectionProduct>) => {
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/collection/products/${product.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error || `Failed to update product (${response.status})`
        )
      }

      const result = await response.json()
      const updatedProduct = result.data as CollectionProductWithPriceChanges

      onUpdate?.(updatedProduct)
      setIsEditing(false)
      setSuccessMessage('Product updated successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error updating product:', error)
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to update product'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const marketPrice = getProductMarketPrice(product)
  const totalValue = getProductTotalValue(product)
  const quantity = product.quantity || 1

  return (
    <>
      <div className="p-4">
        {/* Responsive layout */}
        <div className="flex flex-col md:flex-row md:gap-4 lg:flex-col lg:gap-0">
          {/* Product Image */}
          <div className="flex justify-center md:flex-shrink-0 mb-4">
            <div className="relative w-48 md:w-40 lg:w-full lg:max-w-64">
              <Image
                src={getProductImageUrl(product)}
                alt={getProductDisplayName(product)}
                width={240}
                height={336}
                className="w-full h-auto rounded-lg shadow-md object-contain bg-grey-100"
                priority
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="flex-1 space-y-4">
            {/* Product Information */}
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-grey-900 mb-1">
                  {getProductDisplayName(product)}
                </h3>
                <p className="text-sm text-grey-600">
                  {getProductSetName(product)}
                </p>
              </div>

              {/* Price Info */}
              {marketPrice !== null && (
                <div className="bg-grey-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-grey-600">Market Price</span>
                    <span className="text-sm font-medium text-grey-900">
                      ${marketPrice.toFixed(2)}
                    </span>
                  </div>
                  {quantity > 1 && totalValue !== null && (
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-grey-200">
                      <span className="text-sm text-grey-600">
                        Total Value ({quantity}x)
                      </span>
                      <span className="text-sm font-semibold text-green-600">
                        ${totalValue.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Edit Mode or Display Mode */}
            {isEditing ? (
              <EditProductForm
                product={product}
                onSave={handleSaveProduct}
                onCancel={() => setIsEditing(false)}
                isSubmitting={isSubmitting}
              />
            ) : (
              <>
                {/* Collection-specific Details */}
                <div className="border-t pt-3">
                  <h4 className="text-sm font-semibold text-grey-900 mb-2">
                    Your Collection
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-grey-600">Quantity</span>
                      <span className="font-medium">{quantity}</span>
                    </div>
                    {product.condition && (
                      <div className="flex justify-between">
                        <span className="text-grey-600">Condition</span>
                        <span className="font-medium">
                          {formatProductCondition(product.condition)}
                        </span>
                      </div>
                    )}
                    {product.purchase_price !== null && (
                      <div className="flex justify-between">
                        <span className="text-grey-600">Purchase Price</span>
                        <span className="font-medium text-green-600">
                          ${product.purchase_price.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {product.purchased_at && (
                      <div className="flex justify-between">
                        <span className="text-grey-600">Purchase Date</span>
                        <span className="font-medium">
                          {new Date(product.purchased_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {product.created_at && (
                      <div className="flex justify-between">
                        <span className="text-grey-600">Added to Collection</span>
                        <span className="font-medium">
                          {new Date(product.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {product.notes && (
                      <div>
                        <span className="text-grey-600">Notes</span>
                        <p className="mt-1 text-grey-900">{product.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Success/Error Messages */}
                {successMessage && (
                  <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-md text-sm">
                    {successMessage}
                  </div>
                )}
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-md text-sm">
                    {errorMessage}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteDialog(true)}
                    className="flex-1 px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-md hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteProductDialog
        product={product}
        isOpen={showDeleteDialog}
        onConfirm={handleDeleteProduct}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </>
  )
}

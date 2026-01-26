'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  type CollectionProductWithPriceChanges,
  getProductDisplayName,
  getProductImageUrl
} from '@/utils/collectionProductUtils'

interface DeleteProductDialogProps {
  product: CollectionProductWithPriceChanges
  isOpen: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export default function DeleteProductDialog({
  product,
  isOpen,
  onConfirm,
  onCancel
}: DeleteProductDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  const productName = getProductDisplayName(product)
  const productImage = getProductImageUrl(product)
  const quantity = product.quantity || 1

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            {productImage && productImage !== '/product-placeholder.svg' && (
              <div className="flex-shrink-0">
                <Image
                  src={productImage}
                  alt={productName}
                  width={60}
                  height={84}
                  className="rounded object-contain"
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-grey-900">
                Remove from Collection?
              </h3>
              <p className="mt-2 text-sm text-grey-600">
                Are you sure you want to remove{' '}
                <span className="font-medium">{productName}</span>
                {quantity > 1 && ` (${quantity} units)`} from your collection?
              </p>
              <p className="mt-2 text-sm text-red-600">
                This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 border border-grey-300 text-grey-700 text-sm font-medium rounded-md hover:bg-grey-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useAuth } from '@/hooks/useAuth'
import { useQuickViewLayout, useQuickViewNavigation } from '@/components/ui/QuickView'
import { getTCGPlayerProductUrl, getEbaySearchUrl } from '@/utils/external-links'
import AddProductToCollectionForm from '@/components/collection/AddProductToCollectionForm'

interface PriceHistoryPoint {
  price_date: string
  market_price: number | null
  low_price: number | null
  mid_price: number | null
  high_price: number | null
}

interface ProductData {
  id: number
  name: string
  tcgplayer_product_id: number
  tcgplayer_image_url: string | null
  pokemon_sets: {
    id: string
    name: string
    logo: string | null
    symbol: string | null
  } | null
  current_price: {
    market_price: number | null
    low_price: number | null
    mid_price: number | null
    high_price: number | null
    price_date: string | null
  } | null
  price_history: PriceHistoryPoint[]
}

interface ProductQuickViewContentProps {
  productId: string
  setId?: string
  onClose?: () => void
  onCollectionUpdate?: () => void
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

/**
 * ProductQuickViewContent Component
 *
 * Displays product details for browsing context (Pokemon sets sealed products).
 * Handles fetching product data, rendering product information with price chart,
 * and collection actions. This component focuses on content only - layout is
 * handled by QuickView wrapper.
 */
export default function ProductQuickViewContent({
  productId,
  onCollectionUpdate,
  onSuccess,
  onError
}: ProductQuickViewContentProps) {
  const { user } = useAuth()
  const layout = useQuickViewLayout()
  const navigation = useQuickViewNavigation()

  // Modal (tablet) uses two-column layout, sidesheet/bottomsheet use single column
  const isTwoColumn = layout === 'modal'
  const isBottomSheet = layout === 'bottomsheet'

  const [productData, setProductData] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCollectionForm, setShowCollectionForm] = useState(false)

  // Reset form state when navigating to a different product
  useEffect(() => {
    setShowCollectionForm(false)
  }, [productId])

  const loadProductData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/pokemon/products/${productId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch product')
      }

      const data = await response.json()
      setProductData(data)
    } catch (err) {
      setError('Failed to load product details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    if (productId) {
      loadProductData()
    }
  }, [productId, loadProductData])

  // Transform price history for chart - only market price
  const chartData = useMemo(() => {
    if (!productData?.price_history) return []
    return productData.price_history
      .filter(p => p.market_price !== null && p.market_price > 0)
      .map(p => ({
        date: p.price_date,
        value: p.market_price!
      }))
  }, [productData?.price_history])

  // Calculate price change percentage
  const priceChange = useMemo(() => {
    if (chartData.length < 2) return null
    const first = chartData[0].value
    const last = chartData[chartData.length - 1].value
    if (first === 0) return null
    return ((last - first) / first) * 100
  }, [chartData])

  // Calculate evenly spaced X-axis ticks (4 ticks max)
  const xAxisTicks = useMemo(() => {
    if (chartData.length === 0) return []
    if (chartData.length <= 4) return chartData.map(d => d.date)

    const indices = [
      0,
      Math.floor(chartData.length / 3),
      Math.floor((chartData.length * 2) / 3),
      chartData.length - 1,
    ]

    return indices.map(i => chartData[i].date)
  }, [chartData])

  const handleCollectionSuccess = (message: string) => {
    setShowCollectionForm(false)
    onCollectionUpdate?.()
    onSuccess?.(message)
  }

  const handleCollectionError = (errorMsg: string) => {
    onError?.(errorMsg)
  }

  const handleAddToCollectionClick = () => {
    if (!user) {
      window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname)
      return
    }
    setShowCollectionForm(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (error || !productData) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-red-600 text-sm">{error || 'Product not found'}</p>
      </div>
    )
  }

  const currentPrice = productData.current_price?.market_price

  // Format date for X-axis
  const formatChartDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Render price chart component (reused across layouts)
  const renderPriceChart = () => (
    <div className="h-32">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="productPriceGradientUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="productPriceGradientDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickFormatter={formatChartDate}
              ticks={xAxisTicks}
            />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null
                const data = payload[0].payload
                return (
                  <div className="bg-gray-900 px-3 py-2 rounded-lg shadow-lg">
                    <div className="text-white font-bold">${data.value.toFixed(2)}</div>
                    <div className="text-gray-400 text-xs">
                      {new Date(data.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={priceChange !== null && priceChange >= 0 ? '#22c55e' : '#ef4444'}
              strokeWidth={2}
              fill={priceChange !== null && priceChange >= 0 ? 'url(#productPriceGradientUp)' : 'url(#productPriceGradientDown)'}
              dot={false}
              activeDot={{
                r: 4,
                fill: priceChange !== null && priceChange >= 0 ? '#22c55e' : '#ef4444',
                stroke: '#fff',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
          No price history available
        </div>
      )}
    </div>
  )

  // Render shop links
  const renderShopLinks = (className: string = '') => (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      <a
        href={getTCGPlayerProductUrl(productData.tcgplayer_product_id)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center px-3 py-2.5 border border-grey-300 text-grey-600 text-xs font-medium rounded-lg hover:border-grey-400 hover:bg-grey-50 transition-colors"
      >
        <svg className="mr-1.5 w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        TCGPlayer
        <svg className="ml-1 w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
      <a
        href={getEbaySearchUrl(productData.name)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center px-3 py-2.5 border border-grey-300 text-grey-600 text-xs font-medium rounded-lg hover:border-grey-400 hover:bg-grey-50 transition-colors"
      >
        <svg className="mr-1.5 w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        eBay
        <svg className="ml-1 w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  )

  // Render product image with fallback
  const renderProductImage = (width: number, height: number, className: string = '') => {
    if (productData.tcgplayer_image_url) {
      return (
        <Image
          src={productData.tcgplayer_image_url}
          alt={productData.name}
          width={width}
          height={height}
          className={`w-full h-auto rounded-lg shadow-md object-contain ${className}`}
          priority
        />
      )
    }

    return (
      <div className={`w-full aspect-[2.5/3.5] bg-grey-100 rounded-lg flex items-center justify-center ${className}`}>
        <svg className="w-12 h-12 text-grey-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
    )
  }

  // MOBILE: Bottom Sheet Layout with sticky footer
  if (isBottomSheet) {
    return (
      <div className="flex flex-col h-full">
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4">
          {/* Header: Thumbnail + Title side by side */}
          <div className="flex gap-4 mb-4">
            {/* Small thumbnail */}
            <div className="flex-shrink-0 w-24">
              {renderProductImage(96, 134)}
            </div>
            {/* Title info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-grey-900 line-clamp-2">{productData.name}</h3>
              <p className="text-sm text-grey-600">{productData.pokemon_sets?.name || 'Unknown Set'}</p>
              {currentPrice && (
                <div className="mt-2">
                  <span className="text-xl font-bold text-grey-900">${currentPrice.toFixed(2)}</span>
                  {priceChange !== null && (
                    <span className={`ml-2 text-sm font-medium ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Price Chart */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-grey-900 mb-1">90-Day Price History</h4>
            {renderPriceChart()}
          </div>

          {/* Collection Form (if showing) */}
          {showCollectionForm && (
            <div className="mt-4">
              <AddProductToCollectionForm
                productId={productData.id}
                productName={productData.name}
                onSuccess={handleCollectionSuccess}
                onError={handleCollectionError}
                onClose={() => setShowCollectionForm(false)}
                mode="modal"
              />
            </div>
          )}
        </div>

        {/* Sticky Footer - Always visible at bottom */}
        {!showCollectionForm && (
          <div className="flex-shrink-0 bg-white border-t border-grey-200 px-4 pt-3 pb-8">
            {/* Primary Action */}
            <button
              onClick={handleAddToCollectionClick}
              className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors"
            >
              {user ? 'Add to Collection' : 'Sign Up to Collect'}
            </button>

            {/* Secondary Actions - Shop buttons */}
            {renderShopLinks('mt-2')}

            {/* Navigation Row */}
            {(navigation.prevCard || navigation.nextCard) && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-grey-100">
                <button
                  onClick={() => navigation.prevCard && navigation.onNavigate(navigation.prevCard.id)}
                  disabled={!navigation.prevCard}
                  className={`flex items-center space-x-1 px-2 py-1.5 text-sm font-medium transition-colors ${
                    navigation.prevCard
                      ? 'text-orange-600 active:bg-orange-50'
                      : 'text-grey-300'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Previous</span>
                </button>

                <button
                  onClick={() => navigation.nextCard && navigation.onNavigate(navigation.nextCard.id)}
                  disabled={!navigation.nextCard}
                  className={`flex items-center space-x-1 px-2 py-1.5 text-sm font-medium transition-colors ${
                    navigation.nextCard
                      ? 'text-orange-600 active:bg-orange-50'
                      : 'text-grey-300'
                  }`}
                >
                  <span>Next</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // TABLET/DESKTOP: Modal and Sidesheet layouts
  return (
    <div className="p-4">
      {/* Layout: Two-column for modal (tablet), single column for sidesheet */}
      <div className={isTwoColumn ? 'flex flex-row gap-6 items-start' : 'flex flex-col'}>
        {/* Product Image */}
        <div className={isTwoColumn ? 'flex-shrink-0 w-48' : 'flex justify-center mb-3'}>
          <div className={isTwoColumn ? 'w-full' : 'w-full max-w-[200px]'}>
            {renderProductImage(200, 280)}
          </div>
        </div>

        {/* Product Details */}
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div>
            <h3 className="text-base font-semibold text-grey-900 mb-0.5">{productData.name}</h3>
            <p className="text-sm text-grey-600">{productData.pokemon_sets?.name || 'Unknown Set'}</p>
          </div>

          {/* Current Price */}
          <div className="border-t pt-2">
            <h4 className="text-sm font-semibold text-grey-900 mb-1">Market Price</h4>
            {currentPrice ? (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-grey-900">${currentPrice.toFixed(2)}</span>
                {priceChange !== null && (
                  <span className={`text-sm font-medium ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}% (90d)
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-grey-500 italic">Price unavailable</p>
            )}
          </div>

          {/* Price Chart */}
          <div>
            <h4 className="text-xs font-medium text-grey-500 uppercase tracking-wide mb-1">90-Day History</h4>
            {renderPriceChart()}
          </div>

          {/* Actions */}
          {showCollectionForm ? (
            <AddProductToCollectionForm
              productId={productData.id}
              productName={productData.name}
              onSuccess={handleCollectionSuccess}
              onError={handleCollectionError}
              onClose={() => setShowCollectionForm(false)}
              mode="modal"
            />
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleAddToCollectionClick}
                className="w-full bg-orange-600 text-white py-2.5 px-4 rounded-md text-sm font-medium hover:bg-orange-700 transition-colors"
              >
                {user ? 'Add to Collection' : 'Sign Up to Collect'}
              </button>

              {renderShopLinks()}

              <p className="text-xs text-grey-400 text-center">Shopping links may contain affiliate links</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

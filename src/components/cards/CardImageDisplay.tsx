import React, { memo, useState } from 'react'
import Image from 'next/image'
import { Card } from '@/types/database'

interface CardImageDisplayProps {
  card: Card
}

type ImageMode = 'original' | 'full' | 'exact'

const CardImageDisplay = memo(function CardImageDisplay({ card }: CardImageDisplayProps) {
  const [frontImageMode, setFrontImageMode] = useState<ImageMode>('original')
  const [backImageMode, setBackImageMode] = useState<ImageMode>('original')

  const getFrontImageUrl = () => {
    switch (frontImageMode) {
      case 'full':
        return card.front_full_overlay_url || card.front_image_url
      case 'exact':
        return card.front_exact_overlay_url || card.front_image_url
      default:
        return card.front_image_url
    }
  }

  const getBackImageUrl = () => {
    switch (backImageMode) {
      case 'full':
        return card.back_full_overlay_url || card.back_image_url
      case 'exact':
        return card.back_exact_overlay_url || card.back_image_url
      default:
        return card.back_image_url
    }
  }

  const ImageModeButton = ({ 
    mode, 
    currentMode, 
    onClick, 
    children 
  }: { 
    mode: ImageMode
    currentMode: ImageMode
    onClick: () => void
    children: React.ReactNode 
  }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
        currentMode === mode
          ? 'bg-orange-600 text-white'
          : 'bg-grey-100 text-grey-700 hover:bg-grey-200'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Front Image */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-grey-900">Front</h3>
          <div className="flex gap-1">
            <ImageModeButton
              mode="original"
              currentMode={frontImageMode}
              onClick={() => setFrontImageMode('original')}
            >
              Original
            </ImageModeButton>
            {card.front_full_overlay_url && (
              <ImageModeButton
                mode="full"
                currentMode={frontImageMode}
                onClick={() => setFrontImageMode('full')}
              >
                Full
              </ImageModeButton>
            )}
            {card.front_exact_overlay_url && (
              <ImageModeButton
                mode="exact"
                currentMode={frontImageMode}
                onClick={() => setFrontImageMode('exact')}
              >
                Exact
              </ImageModeButton>
            )}
          </div>
        </div>
        <div className="relative aspect-[3/4] bg-grey-100 rounded-lg overflow-hidden">
          {getFrontImageUrl() ? (
            <Image
              src={getFrontImageUrl()!}
              alt={`${card.card_title || 'Trading card'} - Front`}
              className="w-full h-full object-contain"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-grey-400">
                <svg className="h-16 w-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">No front image</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Back Image */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-grey-900">Back</h3>
          <div className="flex gap-1">
            <ImageModeButton
              mode="original"
              currentMode={backImageMode}
              onClick={() => setBackImageMode('original')}
            >
              Original
            </ImageModeButton>
            {card.back_full_overlay_url && (
              <ImageModeButton
                mode="full"
                currentMode={backImageMode}
                onClick={() => setBackImageMode('full')}
              >
                Full
              </ImageModeButton>
            )}
            {card.back_exact_overlay_url && (
              <ImageModeButton
                mode="exact"
                currentMode={backImageMode}
                onClick={() => setBackImageMode('exact')}
              >
                Exact
              </ImageModeButton>
            )}
          </div>
        </div>
        <div className="relative aspect-[3/4] bg-grey-100 rounded-lg overflow-hidden">
          {getBackImageUrl() ? (
            <Image
              src={getBackImageUrl()!}
              alt={`${card.card_title || 'Trading card'} - Back`}
              className="w-full h-full object-contain"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-grey-400">
                <svg className="h-16 w-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">No back image</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default CardImageDisplay
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import CardIdentificationModal from './CardIdentificationModal'
import { Match } from '@/types/ximilar'

interface Card {
  id: string
  user_id: string
  front_image_url: string | null
  back_image_url: string | null
  front_full_overlay_url: string | null
  front_exact_overlay_url: string | null
  back_full_overlay_url: string | null
  back_exact_overlay_url: string | null
  card_title: string | null
  estimated_grade: number | null
  confidence: number | null
  grading_details: Record<string, unknown> | null
  // New card identification fields
  card_set: string | null
  rarity: string | null
  out_of: string | null
  card_number: string | null
  set_series_code: string | null
  set_code: string | null
  series: string | null
  year: number | null
  subcategory: string | null
  links: {
    'tcgplayer.com'?: string
    'ebay.com'?: string
  } | null
  analyze_details: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

interface CardDetailsProps {
  cardId: string
  onBack: () => void
}

export default function CardDetails({ cardId, onBack }: CardDetailsProps) {
  const [card, setCard] = useState<Card | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [frontImageMode, setFrontImageMode] = useState<'original' | 'full' | 'exact'>('original')
  const [backImageMode, setBackImageMode] = useState<'original' | 'full' | 'exact'>('original')
  const [showEditModal, setShowEditModal] = useState(false)

  const loadCard = useCallback(async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        setError('User not authenticated')
        setLoading(false)
        return
      }

      const { data: cardData, error: cardError } = await supabase
        .from('cards')
        .select('*')
        .eq('id', cardId)
        .eq('user_id', user.id) // Ensure user owns this card
        .single()

      if (cardError) {
        console.error('Error loading card:', cardError)
        setError('Card not found')
      } else {
        setCard(cardData)
      }
    } catch (err) {
      console.error('Error in loadCard:', err)
      setError('Failed to load card details')
    } finally {
      setLoading(false)
    }
  }, [cardId])

  useEffect(() => {
    loadCard()
  }, [loadCard])

  const handleDelete = async () => {
    if (!card || !confirm('Are you sure you want to delete this card? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const user = await getCurrentUser()
      if (!user) {
        setError('User not authenticated')
        return
      }

      // Delete the card record
      const { error: deleteError } = await supabase
        .from('cards')
        .delete()
        .eq('id', card.id)
        .eq('user_id', user.id) // Ensure user owns this card

      if (deleteError) {
        console.error('Error deleting card:', deleteError)
        setError('Failed to delete card')
      } else {
        // TODO: Also delete images from storage
        onBack() // Go back to collection view
      }
    } catch (err) {
      console.error('Error in handleDelete:', err)
      setError('Failed to delete card')
    } finally {
      setDeleting(false)
    }
  }

  const handleEditDetails = () => {
    setShowEditModal(true)
  }

  const handleEditModalConfirm = () => {
    setShowEditModal(false)
    // Reload card data to get updated information
    loadCard()
  }

  const handleEditModalClose = () => {
    setShowEditModal(false)
  }

  const formatGrade = (grade: number | null): string => {
    if (grade === null) return 'Not graded'
    return `${grade}/10`
  }

  const formatConfidence = (confidence: number | null): string => {
    if (confidence === null) return 'N/A'
    return `${Math.round(confidence * 100)}%`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString()
  }

  const getGradeColor = (grade: number | null): string => {
    if (grade === null) return 'bg-grey-100 text-grey-800'
    if (grade >= 9) return 'bg-green-100 text-green-800'
    if (grade >= 7) return 'bg-yellow-100 text-yellow-800'
    if (grade >= 5) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  const getGradeBarColor = (grade: number | null): string => {
    if (grade === null) return 'bg-grey-300'
    if (grade >= 9) return 'bg-green-500'
    if (grade >= 7) return 'bg-yellow-500'
    if (grade >= 5) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getGradeWidth = (grade: number | null): number => {
    if (grade === null) return 0
    return Math.min(Math.max(grade / 10 * 100, 0), 100)
  }

  const formatCondition = (condition: string | null): string => {
    if (!condition) return 'Unknown'
    return condition
  }

  const getConditionColor = (condition: string | null): string => {
    if (!condition) return 'bg-grey-100 text-grey-800'
    const cond = condition.toLowerCase()
    if (cond.includes('mint')) return 'bg-green-100 text-green-800'
    if (cond.includes('excellent')) return 'bg-yellow-100 text-yellow-800'
    if (cond.includes('good')) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  // Card Image Display Component with overlay toggles
  const CardImageDisplay = ({ 
    side, 
    originalUrl, 
    fullOverlayUrl, 
    exactOverlayUrl, 
    imageMode, 
    setImageMode 
  }: { 
    side: string;
    originalUrl: string | null; 
    fullOverlayUrl: string | null; 
    exactOverlayUrl: string | null; 
    imageMode: 'original' | 'full' | 'exact';
    setImageMode: (mode: 'original' | 'full' | 'exact') => void;
  }) => {
    const getCurrentImageUrl = () => {
      switch (imageMode) {
        case 'full': return fullOverlayUrl
        case 'exact': return exactOverlayUrl
        default: return originalUrl
      }
    }

    const hasOverlays = fullOverlayUrl || exactOverlayUrl

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-grey-900">{side}</h3>
          {hasOverlays && (
            <div className="flex bg-grey-100 rounded-lg p-1">
              <button
                onClick={() => setImageMode('original')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  imageMode === 'original' 
                    ? 'bg-white text-grey-900 shadow-sm' 
                    : 'text-grey-600 hover:text-grey-900'
                }`}
              >
                Original
              </button>
              {fullOverlayUrl && (
                <button
                  onClick={() => setImageMode('full')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    imageMode === 'full' 
                      ? 'bg-white text-grey-900 shadow-sm' 
                      : 'text-grey-600 hover:text-grey-900'
                  }`}
                >
                  Analysis
                </button>
              )}
              {exactOverlayUrl && (
                <button
                  onClick={() => setImageMode('exact')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    imageMode === 'exact' 
                      ? 'bg-white text-grey-900 shadow-sm' 
                      : 'text-grey-600 hover:text-grey-900'
                  }`}
                >
                  Detailed
                </button>
              )}
            </div>
          )}
        </div>
        <div className="aspect-w-3 aspect-h-4 bg-grey-100 rounded-lg overflow-hidden">
          {(() => {
            const imageUrl = getCurrentImageUrl();
            return imageUrl ? (
              <img
                src={imageUrl}
                alt={`Card ${side.toLowerCase()}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <span className="text-grey-400">No image</span>
              </div>
            );
          })()}
        </div>
        {hasOverlays && imageMode !== 'original' && (
          <p className="mt-2 text-xs text-grey-500">
            {imageMode === 'full' ? 'Showing AI grading analysis overlay' : 'Showing detailed grading breakdown'}
          </p>
        )}
      </div>
    )
  }

  // Grade Bar Component
  const GradeBar = ({ label, grade }: { label: string; grade: number | null }) => (
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium text-grey-700 w-20">{label}:</span>
      <div className="flex-1 mx-3">
        <div className="w-full bg-grey-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getGradeBarColor(grade)}`}
            style={{ width: `${getGradeWidth(grade)}%` }}
          />
        </div>
      </div>
      <span className="text-sm font-semibold text-grey-900 w-8 text-right">
        {grade ? grade.toFixed(1) : 'N/A'}
      </span>
    </div>
  )

  // Grade Summary Card Component
  const GradeSummaryCard = ({ 
    title, 
    grades, 
    condition 
  }: { 
    title: string; 
    grades: Record<string, unknown> | null; 
    condition: string | null;
  }) => {
    if (!grades) {
      return (
        <div className="bg-white border border-grey-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-grey-900 mb-4">{title}</h4>
          <p className="text-grey-500">No grading data available</p>
        </div>
      )
    }

    return (
      <div className="bg-white border border-grey-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-grey-900">{title}</h4>
          <span className="text-2xl font-bold text-orange-600">
            {grades.final ? `${grades.final as number}/10` : 'N/A'}
          </span>
        </div>
        
        <div className="space-y-2 mb-4">
          <GradeBar label="Corners" grade={grades.corners as number || null} />
          <GradeBar label="Edges" grade={grades.edges as number || null} />
          <GradeBar label="Surface" grade={grades.surface as number || null} />
          <GradeBar label="Centering" grade={grades.centering as number || null} />
        </div>

        <div className="pt-3 border-t border-grey-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-grey-700">Condition:</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConditionColor(condition)}`}>
              {formatCondition(condition)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (error || !card) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error || 'Card not found'}</div>
        <button
          onClick={onBack}
          className="text-orange-600 hover:text-orange-500"
        >
          Back to Collection
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-orange-600 hover:text-orange-500"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Collection
        </button>
        
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
        >
          {deleting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
              Deleting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Card
            </>
          )}
        </button>
      </div>

      {/* Card Info */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-grey-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-grey-900">
              {card.card_title || 'Untitled Card'}
            </h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(card.estimated_grade)}`}>
              Grade: {formatGrade(card.estimated_grade)}
            </span>
          </div>
          <p className="mt-1 text-sm text-grey-500">
            Analyzed on {formatDate(card.created_at)}
          </p>
        </div>

        <div className="p-6">
          {/* Card Identification Section */}
          <div className="mb-8 bg-grey-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-grey-900">Card Information</h3>
              <button
                onClick={handleEditDetails}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Details
              </button>
            </div>
            
            
            {(card.card_set || card.rarity || card.card_number || card.year || card.subcategory || card.links) ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {card.card_set && (
                    <div>
                      <span className="text-sm font-medium text-grey-700">Set:</span>
                      <p className="text-grey-900">{card.card_set}</p>
                    </div>
                  )}
                  
                  {card.rarity && (
                    <div>
                      <span className="text-sm font-medium text-grey-700">Rarity:</span>
                      <p className="text-grey-900">{card.rarity}</p>
                    </div>
                  )}
                  
                  {card.card_number && (
                    <div>
                      <span className="text-sm font-medium text-grey-700">Card Number:</span>
                      <p className="text-grey-900">
                        {card.card_number}
                        {card.out_of && ` / ${card.out_of}`}
                      </p>
                    </div>
                  )}
                  
                  {card.year && (
                    <div>
                      <span className="text-sm font-medium text-grey-700">Year:</span>
                      <p className="text-grey-900">{card.year}</p>
                    </div>
                  )}
                  
                  {card.series && (
                    <div>
                      <span className="text-sm font-medium text-grey-700">Series:</span>
                      <p className="text-grey-900">{card.series}</p>
                    </div>
                  )}
                  
                  {card.subcategory && (
                    <div>
                      <span className="text-sm font-medium text-grey-700">Category:</span>
                      <p className="text-grey-900">{card.subcategory}</p>
                    </div>
                  )}
                </div>
                
                {/* Market Links */}
                {card.links && (card.links['tcgplayer.com'] || card.links['ebay.com']) && (
                  <div className="mt-4 pt-4 border-t border-grey-200">
                    <span className="text-sm font-medium text-grey-700 block mb-2">Market Links:</span>
                    <div className="flex gap-2">
                      {card.links['tcgplayer.com'] && (
                        <a
                          href={card.links['tcgplayer.com']}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          TCGPlayer
                        </a>
                      )}
                      {card.links['ebay.com'] && (
                        <a
                          href={card.links['ebay.com']}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-grey-700 bg-white border border-grey-300 rounded-md hover:bg-grey-50"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          eBay
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-grey-500 text-sm">No card information available. Click &quot;Edit Details&quot; to add card details.</p>
            )}
          </div>

          {/* Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <CardImageDisplay
              side="Front"
              originalUrl={card.front_image_url}
              fullOverlayUrl={card.front_full_overlay_url}
              exactOverlayUrl={card.front_exact_overlay_url}
              imageMode={frontImageMode}
              setImageMode={setFrontImageMode}
            />
            <CardImageDisplay
              side="Back"
              originalUrl={card.back_image_url}
              fullOverlayUrl={card.back_full_overlay_url}
              exactOverlayUrl={card.back_exact_overlay_url}
              imageMode={backImageMode}
              setImageMode={setBackImageMode}
            />
          </div>

          {/* Grading Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-grey-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-grey-900 mb-2">Grade</h3>
              <p className="text-2xl font-bold text-orange-600">{formatGrade(card.estimated_grade)}</p>
            </div>

            <div className="bg-grey-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-grey-900 mb-2">Confidence</h3>
              <p className="text-2xl font-bold text-orange-600">{formatConfidence(card.confidence)}</p>
            </div>

            <div className="bg-grey-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-grey-900 mb-2">Status</h3>
              <p className="text-lg font-medium text-green-600">
                {card.estimated_grade ? 'Analyzed' : 'Processing'}
              </p>
            </div>
          </div>

          {/* Grade Breakdown */}
          {card.grading_details && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-grey-900 mb-6">Grade Breakdown</h3>
              
              {/* Grade Calculation Info */}
              {(() => {
                const weightedCalc = (card.grading_details as Record<string, unknown>)?.weighted_calculation as Record<string, unknown>;
                return weightedCalc && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-semibold text-orange-800 mb-2">Final Grade Calculation</h4>
                    <p className="text-sm text-orange-700">
                      {String(weightedCalc.note || 'Professional grading algorithm considers all aspects of card condition')}
                    </p>
                    {Boolean(weightedCalc.front_grade && weightedCalc.back_grade) && (
                      <div className="mt-2 text-xs text-orange-600">
                        Front Grade: {String(weightedCalc.front_grade)} | 
                        Back Grade: {String(weightedCalc.back_grade)} → 
                        Final: {String(weightedCalc.ximilar_final_grade)}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GradeSummaryCard
                  title="Front"
                  grades={((card.grading_details as Record<string, unknown>)?.ximilar_response as Record<string, unknown>)?.records ? 
                    ((((card.grading_details as Record<string, unknown>).ximilar_response as Record<string, unknown>).records as Array<Record<string, unknown>>).find((r: Record<string, unknown>) => r.side === 'front') as Record<string, unknown>)?.grades as Record<string, unknown> || null : null}
                  condition={((card.grading_details as Record<string, unknown>)?.ximilar_response as Record<string, unknown>)?.records ? 
                    (((((card.grading_details as Record<string, unknown>).ximilar_response as Record<string, unknown>).records as Array<Record<string, unknown>>).find((r: Record<string, unknown>) => r.side === 'front') as Record<string, unknown>)?.grades as Record<string, unknown>)?.condition as string || null : null}
                />
                <GradeSummaryCard
                  title="Back"
                  grades={((card.grading_details as Record<string, unknown>)?.ximilar_response as Record<string, unknown>)?.records ? 
                    ((((card.grading_details as Record<string, unknown>).ximilar_response as Record<string, unknown>).records as Array<Record<string, unknown>>).find((r: Record<string, unknown>) => r.side === 'back') as Record<string, unknown>)?.grades as Record<string, unknown> || null : null}
                  condition={((card.grading_details as Record<string, unknown>)?.ximilar_response as Record<string, unknown>)?.records ? 
                    (((((card.grading_details as Record<string, unknown>).ximilar_response as Record<string, unknown>).records as Array<Record<string, unknown>>).find((r: Record<string, unknown>) => r.side === 'back') as Record<string, unknown>)?.grades as Record<string, unknown>)?.condition as string || null : null}
                />
              </div>
              
              {/* Analysis Metadata */}
              <div className="mt-6 pt-6 border-t border-grey-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-grey-600">
                  <div>
                    <span className="font-medium">Analysis Date:</span>{' '}
                    {((card.grading_details as Record<string, unknown>)?.metadata as Record<string, unknown>)?.analysis_date 
                      ? new Date(((card.grading_details as Record<string, unknown>).metadata as Record<string, unknown>).analysis_date as string).toLocaleString()
                      : 'N/A'
                    }
                  </div>
                  <div>
                    <span className="font-medium">API Version:</span>{' '}
                    {((card.grading_details as Record<string, unknown>)?.metadata as Record<string, unknown>)?.api_version as string || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Processing Time:</span>{' '}
                    {((card.grading_details as Record<string, unknown>)?.metadata as Record<string, unknown>)?.processing_time 
                      ? `${((card.grading_details as Record<string, unknown>).metadata as Record<string, unknown>).processing_time}s`
                      : 'N/A'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {card && (
        <CardIdentificationModal
          isOpen={showEditModal}
          onClose={handleEditModalClose}
          onConfirm={handleEditModalConfirm}
          cardId={card.id}
          identificationData={{
            set: card.card_set || undefined,
            rarity: card.rarity || undefined,
            full_name: card.card_title || undefined,
            out_of: card.out_of || undefined,
            card_number: card.card_number || undefined,
            set_series_code: card.set_series_code || undefined,
            set_code: card.set_code || undefined,
            series: card.series || undefined,
            year: card.year?.toString() || undefined,
            subcategory: card.subcategory || undefined,
            links: card.links || undefined
          } as Match}
          analyzeSuccess={false} // Always show in edit mode
          analyzeMessage={null}
          estimatedGrade={card.estimated_grade}
        />
      )}
    </div>
  )
}
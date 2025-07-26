import React, { memo } from 'react'
import { Card } from '@/types/database'

interface CardInfoPanelProps {
  card: Card
  onEdit: () => void
}

const CardInfoPanel = memo(function CardInfoPanel({ card, onEdit }: CardInfoPanelProps) {
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between py-2 border-b border-grey-100 last:border-b-0">
      <span className="text-sm font-medium text-grey-600">{label}:</span>
      <span className="text-sm text-grey-900 text-right flex-1 ml-4">
        {value || <span className="text-grey-400 italic">Not specified</span>}
      </span>
    </div>
  )

  const LinkButton = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center px-3 py-1 border border-orange-300 text-orange-700 text-xs font-medium rounded-md hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
    >
      {children}
      <svg className="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  )

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-grey-900">Card Information</h3>
        <button
          onClick={onEdit}
          className="inline-flex items-center px-3 py-2 border border-orange-300 text-orange-700 text-sm font-medium rounded-md hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Details
        </button>
      </div>

      <div className="space-y-1">
        <InfoRow label="Title" value={card.card_title} />
        <InfoRow label="Set" value={card.card_set} />
        <InfoRow label="Card Number" value={card.card_number} />
        <InfoRow label="Rarity" value={card.rarity} />
        <InfoRow label="Series" value={card.series} />
        <InfoRow label="Year" value={card.year} />
        <InfoRow label="Subcategory" value={card.subcategory} />
        <InfoRow label="Set Code" value={card.set_code} />
        <InfoRow label="Series Code" value={card.set_series_code} />
        <InfoRow label="Out of" value={card.out_of} />
      </div>

      {/* External Links */}
      {card.links && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-grey-900 mb-3">External Links</h4>
          <div className="flex gap-2 flex-wrap">
            {typeof card.links === 'object' && card.links !== null && (
              <>
                {(card.links as Record<string, unknown>)['tcgplayer.com'] && (
                  <LinkButton href={(card.links as Record<string, unknown>)['tcgplayer.com'] as string}>
                    TCGPlayer
                  </LinkButton>
                )}
                {(card.links as Record<string, unknown>)['ebay.com'] && (
                  <LinkButton href={(card.links as Record<string, unknown>)['ebay.com'] as string}>
                    eBay
                  </LinkButton>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="mt-6 pt-4 border-t border-grey-200">
        <h4 className="text-sm font-medium text-grey-900 mb-3">Metadata</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="font-medium text-grey-600">Added:</span>
            <div className="text-grey-900">{formatDate(card.created_at)}</div>
          </div>
          <div>
            <span className="font-medium text-grey-600">Updated:</span>
            <div className="text-grey-900">{formatDate(card.updated_at)}</div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default CardInfoPanel
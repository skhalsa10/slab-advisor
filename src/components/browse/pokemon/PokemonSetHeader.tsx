import Link from 'next/link'
import Image from 'next/image'
import { getLogoUrl } from '@/lib/pokemon-db'
import type { PokemonSetWithCardsAndProducts } from '@/models/pokemon'

interface PokemonSetHeaderProps {
  setData: PokemonSetWithCardsAndProducts
  backHref?: string
  backText?: string
}

export default function PokemonSetHeader({ 
  setData, 
  backHref = "/browse/pokemon",
  backText = "← Back to Sets"
}: PokemonSetHeaderProps) {
  return (
    <div className="bg-white rounded-lg border border-grey-200 p-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          {setData.logo && (
            <Image
              src={getLogoUrl(setData.logo)}
              alt={setData.name}
              width={80}
              height={80}
              className="object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-grey-900">{setData.name}</h1>
            <p className="mt-1 text-sm text-grey-600">
              {setData.series?.name} • {setData.card_count_total || 0} cards
            </p>
            {setData.release_date && (
              <p className="mt-1 text-sm text-grey-500">
                Released: {new Date(setData.release_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <Link
          href={backHref}
          className="text-sm text-orange-600 hover:text-orange-700 self-start"
        >
          {backText}
        </Link>
      </div>
      
      {/* Action Buttons */}
      {setData.tcgplayer_url && (
        <div className="mt-4">
          <a
            href={setData.tcgplayer_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors"
          >
            Shop on TCGPlayer
            <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}

      {/* Set Statistics */}
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-grey-50 rounded-lg p-3">
            <p className="text-xs text-grey-600">Total Cards</p>
            <p className="text-lg font-semibold text-grey-900">{setData.card_count_total || 0}</p>
          </div>
          <div className="bg-grey-50 rounded-lg p-3">
            <p className="text-xs text-grey-600">Official Count</p>
            <p className="text-lg font-semibold text-grey-900">{setData.card_count_official || 0}</p>
          </div>
          {setData.card_count_holo !== null && setData.card_count_holo > 0 && (
            <div className="bg-grey-50 rounded-lg p-3">
              <p className="text-xs text-grey-600">Holo Cards</p>
              <p className="text-lg font-semibold text-grey-900">{setData.card_count_holo}</p>
            </div>
          )}
          {setData.card_count_reverse !== null && setData.card_count_reverse > 0 && (
            <div className="bg-grey-50 rounded-lg p-3">
              <p className="text-xs text-grey-600">Reverse Holo</p>
              <p className="text-lg font-semibold text-grey-900">{setData.card_count_reverse}</p>
            </div>
          )}
          {setData.card_count_first_ed !== null && setData.card_count_first_ed > 0 && (
            <div className="bg-grey-50 rounded-lg p-3">
              <p className="text-xs text-grey-600">1st Edition</p>
              <p className="text-lg font-semibold text-grey-900">{setData.card_count_first_ed}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
import Link from 'next/link'
import Image from 'next/image'
import { getLogoUrl } from '@/lib/pokemon-db'
import type { PokemonSetWithCardsAndProducts } from '@/models/pokemon'
import { validateTCGPlayerGroups } from '@/models/pokemon'
import SetStatistics from '@/components/sets/SetStatistics'
import SetOwnershipSummary from '@/components/sets/SetOwnershipSummary'
import ShopTheSet from '@/components/sets/ShopTheSet'

interface PokemonSetHeaderProps {
  setData: PokemonSetWithCardsAndProducts
  backHref?: string
  backText?: string
  onOwnershipRefetchReady?: (refetch: () => Promise<void>) => void
}

export default function PokemonSetHeader({
  setData,
  backHref = "/browse/pokemon",
  backText = "← Back to Sets",
  onOwnershipRefetchReady
}: PokemonSetHeaderProps) {
  // Safely validate TCGPlayer groups data
  const validatedTCGPlayerGroups = validateTCGPlayerGroups(setData.tcgplayer_groups)
  return (
    <div className="bg-white rounded-lg border border-grey-200 p-6 space-y-6">
      {/* Back button - mobile only, top of header */}
      <div className="block sm:hidden">
        <Link
          href={backHref}
          className="text-sm text-orange-600 hover:text-orange-700"
        >
          {backText}
        </Link>
      </div>
      
      {/* Main header content */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center space-x-4">
          {(setData.logo || setData.secondary_logo) && (
            <Image
              src={getLogoUrl(setData.logo, setData.secondary_logo)}
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
        
        {/* Back button - desktop only, right side */}
        <Link
          href={backHref}
          className="hidden sm:block text-sm text-orange-600 hover:text-orange-700 flex-shrink-0"
        >
          {backText}
        </Link>
      </div>

      {/* Divider */}
      <hr className="border-grey-200" />

      {/* All components in one row on desktop, stacked on mobile */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Set Statistics */}
        <div className="xl:flex-[2]">
          <SetStatistics
            totalCards={setData.card_count_total || 0}
            officialCount={setData.card_count_official}
            holoCount={setData.card_count_holo}
            reverseCount={setData.card_count_reverse}
            firstEditionCount={setData.card_count_first_ed}
          />
        </div>

        {/* Ownership Summary - only shows if user is logged in */}
        <div className="xl:flex-1">
          <SetOwnershipSummary
            totalCards={setData.card_count_total || 0}
            setId={setData.id}
            onRefetchReady={onOwnershipRefetchReady}
          />
        </div>

        {/* Shop the Set */}
        <div className="xl:flex-1">
          <ShopTheSet
            tcgPlayerUrl={setData.tcgplayer_url || undefined}
            tcgPlayerGroups={validatedTCGPlayerGroups}
            setName={setData.name}
          />
        </div>
      </div>
    </div>
  )
}
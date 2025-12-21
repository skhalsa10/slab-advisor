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
    <div className="space-y-3">
      {/* Back link - tablet/desktop only, outside white card */}
      <Link
        href={backHref}
        className="hidden sm:block text-sm text-orange-600 hover:text-orange-700"
      >
        {backText}
      </Link>

      {/* White card container */}
      <div className="bg-white rounded-lg border border-grey-200 p-6 space-y-6">
        {/* ===== MOBILE LAYOUT ===== */}
        <div className="sm:hidden space-y-4">
          {/* Mobile header with back chevron */}
          <div className="flex items-center space-x-3">
            <Link
              href={backHref}
              className="flex-shrink-0 -ml-2 p-1 text-grey-600 hover:text-grey-900"
              aria-label="Back to Sets"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>

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
            <h1 className="text-2xl font-bold text-grey-900">{setData.name}</h1>
          </div>

          {/* Divider */}
          <hr className="border-grey-200" />

          {/* Mobile stacked content */}
          <SetStatistics
            totalCards={setData.card_count_total || 0}
            officialCount={setData.card_count_official}
            holoCount={setData.card_count_holo}
            reverseCount={setData.card_count_reverse}
            firstEditionCount={setData.card_count_first_ed}
            seriesName={setData.series?.name}
            releaseDate={setData.release_date}
          />

          <SetOwnershipSummary
            totalCards={setData.card_count_total || 0}
            setId={setData.id}
            setName={setData.name}
            onRefetchReady={onOwnershipRefetchReady}
            variant="bar"
            showTitle={false}
          />

          <ShopTheSet
            tcgPlayerUrl={setData.tcgplayer_url || undefined}
            tcgPlayerGroups={validatedTCGPlayerGroups}
            setName={setData.name}
            showTitle={false}
          />
        </div>

        {/* ===== TABLET LAYOUT (sm to xl) ===== */}
        <div className="hidden sm:block xl:hidden space-y-6">
          {/* Row 1: Logo left-aligned */}
          {(setData.logo || setData.secondary_logo) && (
            <div>
              <Image
                src={getLogoUrl(setData.logo, setData.secondary_logo)}
                alt={setData.name}
                width={140}
                height={140}
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}

          {/* Row 2: Title + Stats + Shop | Ownership */}
          <div className="flex gap-6">
            {/* Left: Title, Stats, Shop */}
            <div className="flex-1 min-w-0 space-y-4">
              <h1 className="text-2xl font-bold text-grey-900">{setData.name}</h1>

              <SetStatistics
                totalCards={setData.card_count_total || 0}
                officialCount={setData.card_count_official}
                holoCount={setData.card_count_holo}
                reverseCount={setData.card_count_reverse}
                firstEditionCount={setData.card_count_first_ed}
                seriesName={setData.series?.name}
                releaseDate={setData.release_date}
              />

              <ShopTheSet
                tcgPlayerUrl={setData.tcgplayer_url || undefined}
                tcgPlayerGroups={validatedTCGPlayerGroups}
                setName={setData.name}
                showTitle={false}
              />
            </div>

            {/* Right: Ownership */}
            <div className="flex-shrink-0">
              <SetOwnershipSummary
                totalCards={setData.card_count_total || 0}
                setId={setData.id}
                setName={setData.name}
                onRefetchReady={onOwnershipRefetchReady}
                variant="circle"
                showTitle={false}
              />
            </div>
          </div>
        </div>

        {/* ===== DESKTOP LAYOUT (xl+) - 3-Column Triad ===== */}
        <div className="hidden xl:grid xl:grid-cols-[1fr_auto_1fr] xl:gap-8 xl:items-center">
          {/* Column 1: Identity & Data (Left) */}
          <div className="space-y-4">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              {(setData.logo || setData.secondary_logo) && (
                <Image
                  src={getLogoUrl(setData.logo, setData.secondary_logo)}
                  alt={setData.name}
                  width={80}
                  height={80}
                  className="object-contain flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              <h1 className="text-2xl font-bold text-grey-900">{setData.name}</h1>
            </div>

            {/* Metadata / Statistics */}
            <SetStatistics
              totalCards={setData.card_count_total || 0}
              officialCount={setData.card_count_official}
              holoCount={setData.card_count_holo}
              reverseCount={setData.card_count_reverse}
              firstEditionCount={setData.card_count_first_ed}
              seriesName={setData.series?.name}
              releaseDate={setData.release_date}
            />
          </div>

          {/* Column 2: The Scoreboard (Center) - Hero Metric */}
          <div className="flex justify-center">
            <SetOwnershipSummary
              totalCards={setData.card_count_total || 0}
              setId={setData.id}
              setName={setData.name}
              onRefetchReady={onOwnershipRefetchReady}
              variant="circle"
              showTitle={false}
            />
          </div>

          {/* Column 3: Action Center (Right) */}
          <div className="flex justify-end">
            <ShopTheSet
              tcgPlayerUrl={setData.tcgplayer_url || undefined}
              tcgPlayerGroups={validatedTCGPlayerGroups}
              setName={setData.name}
              showTitle={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
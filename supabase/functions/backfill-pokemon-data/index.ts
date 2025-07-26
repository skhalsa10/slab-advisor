import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// TCGDex API types
interface SerieBrief {
  id: string
  name: string
}

interface Serie {
  id: string
  name: string
  logo?: string
  sets?: SetBrief[]
}

interface SetBrief {
  id: string
  name: string
}

interface Set {
  id: string
  name: string
  logo?: string
  cards: Card[]
  serie?: Serie
  cardCount?: {
    total: number
    official: number
    holo?: number
    reverse?: number
    firstEd?: number
  }
  releaseDate?: string
}

interface Card {
  id: string
  localId: string | number
  name: string
  image?: string
  category: string
  illustrator?: string
  rarity?: string
  variants?: {
    normal?: boolean
    reverse?: boolean
    holo?: boolean
    firstEdition?: boolean
    wPromo?: boolean
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body for parameters
    let skipSeries = false
    let setStartIndex = 0
    try {
      const body = await req.json()
      skipSeries = body.skipSeries || false
      setStartIndex = body.setStartIndex || 0
    } catch {
      // No body or invalid JSON, use defaults
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const TCGDEX_API_BASE = 'https://api.tcgdex.net/v2/en'

    console.log(`Starting Pokemon data backfill... (skipSeries: ${skipSeries}, setStartIndex: ${setStartIndex})`)

    let seriesData: any[] = []

    if (!skipSeries) {
      // STEP 1: Fetch all series
      console.log('\n=== STEP 1: Fetching All Series ===')
      const seriesListResponse = await fetch(`${TCGDEX_API_BASE}/series`)
      if (!seriesListResponse.ok) {
        throw new Error(`Failed to fetch series list: ${seriesListResponse.status}`)
      }
      const serieBriefs = await seriesListResponse.json()
      console.log(`Found ${serieBriefs.length} series`)
      
      // Fetch full series data for each serie brief
      for (let i = 0; i < serieBriefs.length; i++) {
        const serieBrief = serieBriefs[i]
        console.log(`Fetching series ${i + 1}/${serieBriefs.length}: ${serieBrief.id}`)
        
        try {
          const fullSeriesResponse = await fetch(`${TCGDEX_API_BASE}/series/${serieBrief.id}`)
          if (!fullSeriesResponse.ok) {
            console.error(`  Failed to fetch series ${serieBrief.id}: ${fullSeriesResponse.status}`)
            continue
          }
          
          const fullSeries = await fullSeriesResponse.json()
          
          // Prepare series data for database
          const seriesRecord = {
            id: fullSeries.id,
            name: fullSeries.name,
            logo: fullSeries.logo || null,
            updated_at: new Date().toISOString()
          }
          
          seriesData.push(seriesRecord)
          console.log(`  Added to batch: ${fullSeries.name}`)
          
        } catch (error) {
          console.error(`  Error fetching series ${serieBrief.id}:`, error)
          continue
        }
      }

      // Save all series to database
      console.log(`\nSaving ${seriesData.length} series to database...`)
      const { error: seriesError } = await supabaseClient
        .from('pokemon_series')
        .upsert(seriesData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })

      if (seriesError) {
        console.error('Error saving series:', seriesError)
        throw seriesError
      }

      console.log(`✅ Successfully saved ${seriesData.length} series`)
    } else {
      console.log('\n=== STEP 1: SKIPPED (skipSeries = true) ===')
    }

    // STEP 2: Fetch all sets and their cards
    console.log('\n=== STEP 2: Fetching All Sets ===')
    const setsListResponse = await fetch(`${TCGDEX_API_BASE}/sets`)
    if (!setsListResponse.ok) {
      throw new Error(`Failed to fetch sets list: ${setsListResponse.status}`)
    }
    const setBriefs = await setsListResponse.json()
    console.log(`Found ${setBriefs.length} sets`)
    console.log(`Starting from index ${setStartIndex}, processing 3 sets`)

    let totalSets = 0
    let totalCards = 0
    const maxSetsToProcess = 1
    const endIndex = Math.min(setStartIndex + maxSetsToProcess, setBriefs.length)

    for (let i = setStartIndex; i < endIndex; i++) {
      const setBrief = setBriefs[i]
      console.log(`Processing set ${i + 1}/${setBriefs.length}: ${setBrief.id} (batch ${i - setStartIndex + 1}/${maxSetsToProcess})`)
      
      try {
        // 1. Get full set data
        const fullSetResponse = await fetch(`${TCGDEX_API_BASE}/sets/${setBrief.id}`)
        if (!fullSetResponse.ok) {
          console.error(`  Failed to fetch set ${setBrief.id}: ${fullSetResponse.status}`)
          continue
        }
        const fullSet = await fullSetResponse.json()

        // Save set data to database
        const setData = {
          id: fullSet.id,
          series_id: fullSet.serie?.id || null,
          name: fullSet.name,
          logo: fullSet.logo || null,
          symbol: fullSet.symbol || null,
          card_count_total: fullSet.cardCount?.total || 0,
          card_count_official: fullSet.cardCount?.official || 0,
          card_count_holo: fullSet.cardCount?.holo || 0,
          card_count_reverse: fullSet.cardCount?.reverse || 0,
          card_count_first_ed: fullSet.cardCount?.firstEd || 0,
          release_date: fullSet.releaseDate || null,
          updated_at: new Date().toISOString()
        }

        const { error: setError } = await supabaseClient
          .from('pokemon_sets')
          .upsert([setData], { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })

        if (setError) {
          console.error(`  Error saving set:`, setError)
          throw setError
        }

        totalSets++
        console.log(`  ✅ Saved set: ${fullSet.name}`)

        // 2. Process cards for this set
        if (fullSet.cards && fullSet.cards.length > 0) {
          console.log(`  Processing ${fullSet.cards.length} cards...`)
          const cardsData = []
          
          // Fetch each card individually to get full details including variants
          for (let k = 0; k < fullSet.cards.length; k++) {
            const cardBrief = fullSet.cards[k]

            
            try {
              
              const cardResponse = await fetch(`${TCGDEX_API_BASE}/cards/${cardBrief.id}`)
              if (!cardResponse.ok) {
                console.error(`    Failed to fetch card ${cardBrief.id}: ${cardResponse.status}`)
                continue
              }
              
              const fullCard = await cardResponse.json()
              
              // Map card data for database
              const mappedCard = {
                id: fullCard.id,
                set_id: fullSet.id,
                local_id: fullCard.localId?.toString() || null,
                name: fullCard.name,
                image: fullCard.image || null,
                category: fullCard.category || null,
                illustrator: fullCard.illustrator || null,
                rarity: fullCard.rarity || null,
                variant_normal: fullCard.variants?.normal || false,
                variant_reverse: fullCard.variants?.reverse || false,
                variant_holo: fullCard.variants?.holo || false,
                variant_first_edition: fullCard.variants?.firstEdition || false,
                updated_at: new Date().toISOString()
              }
              
              
              cardsData.push(mappedCard)
              
            } catch (error) {
              console.error(`    Error fetching card ${cardBrief.id}:`, error)
              continue
            }
          }

          // Save cards in batches of 50
          if (cardsData.length > 0) {
            const cardBatchSize = 50
            for (let l = 0; l < cardsData.length; l += cardBatchSize) {
              const batch = cardsData.slice(l, l + cardBatchSize)
            
              
              const { error: cardsError } = await supabaseClient
                .from('pokemon_cards')
                .upsert(batch, { 
                  onConflict: 'id',
                  ignoreDuplicates: false 
                })

              if (cardsError) {
                console.error(`  Error saving cards batch:`, cardsError)
                throw cardsError
              }
            }
            
            totalCards += cardsData.length
            console.log(`  ✅ Saved ${cardsData.length} cards`)
          }
        }

      } catch (error) {
        console.error(`  Error processing set ${setBrief.id}:`, error)
        continue
      }
    }

    console.log(`\n✅ Step 2 Complete: Processed ${totalSets} sets and ${totalCards} cards`)

    // Calculate next index to start at
    const nextStartIndex = setStartIndex + maxSetsToProcess
    const isComplete = nextStartIndex >= setBriefs.length
    
    if (!isComplete) {
      console.log(`\n📝 Next run should use setStartIndex: ${nextStartIndex}`)
    } else {
      console.log(`\n🎉 All sets processed! Backfill complete.`)
    }

    // Final success response
    const response = {
      success: true,
      message: isComplete ? 'Pokemon data backfill completed successfully' : `Batch complete. Next start index: ${nextStartIndex}`,
      stats: {
        series_processed: seriesData.length,
        sets_processed: totalSets,
        cards_processed: totalCards,
        current_batch: {
          start_index: setStartIndex,
          end_index: endIndex - 1,
          processed: totalSets
        },
        next_start_index: isComplete ? null : nextStartIndex,
        is_complete: isComplete,
        timestamp: new Date().toISOString()
      }
    }

    console.log('\n=== Backfill Complete ===')
    console.log(response)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Backfill error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})


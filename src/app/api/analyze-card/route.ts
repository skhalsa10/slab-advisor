import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, getServerSession } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    // 1. Verify user authentication
    const { user, error: authError } = await getServerSession(request)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Create server-side Supabase client with service role
    const supabase = await createServerSupabaseClient()

    // 2. Validate request body
    const { cardId } = await request.json()
    if (!cardId || typeof cardId !== 'string') {
      return NextResponse.json({ error: 'Valid card ID is required' }, { status: 400 })
    }

    // 3. Check user credits before proceeding
    const { data: creditData, error: creditError } = await supabase
      .from('user_credits')
      .select('credits_remaining')
      .eq('user_id', user.id)
      .single()
    
    if (creditError || !creditData || creditData.credits_remaining <= 0) {
      return NextResponse.json({ 
        error: 'No credits remaining. Please purchase more credits to analyze cards.',
        success: false 
      }, { status: 402 })
    }

    // 4. Get card data and verify ownership
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .eq('user_id', user.id) // Ensure user owns this card
      .single()

    if (cardError || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    if (!card.front_image_url || !card.back_image_url) {
      return NextResponse.json({ error: 'Card images not found' }, { status: 400 })
    }

    // Log URLs to verify they're accessible
    console.log('Image URLs being sent to Ximilar:')
    console.log('Front:', card.front_image_url)
    console.log('Back:', card.back_image_url)

    // Test if URLs are publicly accessible
    try {
      const frontCheck = await fetch(card.front_image_url, { method: 'HEAD' })
      const backCheck = await fetch(card.back_image_url, { method: 'HEAD' })
      
      console.log('Front image accessible:', frontCheck.ok, frontCheck.status)
      console.log('Back image accessible:', backCheck.ok, backCheck.status)
      
      if (!frontCheck.ok || !backCheck.ok) {
        return NextResponse.json({ 
          error: 'Card images are not publicly accessible. Please try uploading again.',
          success: false 
        }, { status: 400 })
      }
    } catch (urlError) {
      console.error('Error checking image URLs:', urlError)
    }

    // Call Ximilar API with side field for front/back identification
    const ximilarPayload = {
      records: [
        {
          _url: card.front_image_url,
          side: 'front'
        },
        {
          _url: card.back_image_url,
          side: 'back'
        }
      ]
    }
    
    console.log('Sending to Ximilar:', JSON.stringify(ximilarPayload, null, 2))
    
    // Log the exact request being sent
    const requestBody = JSON.stringify(ximilarPayload)
    console.log('Request body length:', requestBody.length)
    console.log('Request headers:', {
      'Authorization': `Token ${process.env.XIMILAR_API_KEY?.substring(0, 10)}...`, // Log partial key for security
      'Content-Type': 'application/json',
    })

    const ximilarResponse = await fetch('https://api.ximilar.com/card-grader/v2/grade', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.XIMILAR_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    })

    // Log response details
    console.log('Ximilar Response Status:', ximilarResponse.status)
    console.log('Ximilar Response Headers:', Object.fromEntries(ximilarResponse.headers.entries()))

    // Get response text regardless of status
    const responseText = await ximilarResponse.text()
    console.log('Raw Ximilar response:', responseText)

    let ximilarResult: any
    try {
      ximilarResult = JSON.parse(responseText)
      console.log('Parsed Ximilar response:', JSON.stringify(ximilarResult, null, 2))
    } catch (parseError) {
      console.error('Failed to parse Ximilar response as JSON:', parseError)
      return NextResponse.json({ 
        error: 'Invalid response from grading service.',
        success: false 
      }, { status: 500 })
    }

    // Check if we have valid data regardless of HTTP status
    if (!ximilarResult.records || ximilarResult.records.length === 0) {
      console.error('No records in Ximilar response')
      return NextResponse.json({ 
        error: 'Unable to analyze card. Please ensure images are clear and well-lit.',
        success: false 
      }, { status: 400 })
    }

    // Check if we have grading data
    const hasValidGrades = ximilarResult.records.some((r: any) => r.grades && r.grades.final)
    if (!hasValidGrades) {
      console.error('No valid grades found in Ximilar response')
      return NextResponse.json({ 
        error: 'Unable to grade card. Please check image quality.',
        success: false 
      }, { status: 400 })
    }

    // Log that we're proceeding despite potential status issues
    if (!ximilarResponse.ok) {
      console.warn(`Ximilar returned status ${ximilarResponse.status} but has valid grading data - proceeding`)
    }

    // Process Ximilar results with complete response storage
    // Extract results for analysis (using side field)
    const frontResult = ximilarResult.records.find((r: { side: string }) => r.side === 'front')
    const backResult = ximilarResult.records.find((r: { side: string }) => r.side === 'back')

    // Check for card detection errors
    if (frontResult?._status?.code === 400 || backResult?._status?.code === 400) {
      return NextResponse.json({ 
        error: 'Could not detect a trading card in the image. Please ensure:\n• The card is clearly visible and fills most of the frame\n• Good lighting without glare or shadows\n• Card is flat and not at an extreme angle\n• Background contrasts with the card',
        success: false 
      }, { status: 400 })
    }

    // Use Ximilar's final grade calculation (they handle sophisticated weighting/rounding)
    const estimatedGrade = ximilarResult.grades?.final || null
    const confidence = estimatedGrade ? 0.95 : null

    // Store calculation details for transparency
    const frontGrade = frontResult?.grades?.final
    const backGrade = backResult?.grades?.final
    
    const weightedCalculation = {
      front_grade: frontGrade,
      back_grade: backGrade,
      ximilar_final_grade: estimatedGrade,
      note: 'Using Ximilar\'s sophisticated grading algorithm with professional weighting'
    }

    // Download and store overlay images
    let overlayUrls = {
      front_full_overlay_url: null,
      front_exact_overlay_url: null,
      back_full_overlay_url: null,
      back_exact_overlay_url: null
    }

    try {
      // Download overlay images if available
      if (frontResult?._full_url_card) {
        const frontFullResponse = await fetch(frontResult._full_url_card)
        if (frontFullResponse.ok) {
          const frontFullBuffer = await frontFullResponse.arrayBuffer()
          const frontFullFileName = `${user.id}/${cardId}/front_full.webp`
          
          const { error: frontFullError } = await supabase.storage
            .from('card-images')
            .upload(frontFullFileName, frontFullBuffer, {
              contentType: 'image/webp',
              upsert: true
            })
          
          if (!frontFullError) {
            const { data: frontFullUrl } = supabase.storage
              .from('card-images')
              .getPublicUrl(frontFullFileName)
            overlayUrls.front_full_overlay_url = frontFullUrl.publicUrl
          }
        }
      }

      if (frontResult?._exact_url_card) {
        const frontExactResponse = await fetch(frontResult._exact_url_card)
        if (frontExactResponse.ok) {
          const frontExactBuffer = await frontExactResponse.arrayBuffer()
          const frontExactFileName = `${user.id}/${cardId}/front_exact.webp`
          
          const { error: frontExactError } = await supabase.storage
            .from('card-images')
            .upload(frontExactFileName, frontExactBuffer, {
              contentType: 'image/webp',
              upsert: true
            })
          
          if (!frontExactError) {
            const { data: frontExactUrl } = supabase.storage
              .from('card-images')
              .getPublicUrl(frontExactFileName)
            overlayUrls.front_exact_overlay_url = frontExactUrl.publicUrl
          }
        }
      }

      if (backResult?._full_url_card) {
        const backFullResponse = await fetch(backResult._full_url_card)
        if (backFullResponse.ok) {
          const backFullBuffer = await backFullResponse.arrayBuffer()
          const backFullFileName = `${user.id}/${cardId}/back_full.webp`
          
          const { error: backFullError } = await supabase.storage
            .from('card-images')
            .upload(backFullFileName, backFullBuffer, {
              contentType: 'image/webp',
              upsert: true
            })
          
          if (!backFullError) {
            const { data: backFullUrl } = supabase.storage
              .from('card-images')
              .getPublicUrl(backFullFileName)
            overlayUrls.back_full_overlay_url = backFullUrl.publicUrl
          }
        }
      }

      if (backResult?._exact_url_card) {
        const backExactResponse = await fetch(backResult._exact_url_card)
        if (backExactResponse.ok) {
          const backExactBuffer = await backExactResponse.arrayBuffer()
          const backExactFileName = `${user.id}/${cardId}/back_exact.webp`
          
          const { error: backExactError } = await supabase.storage
            .from('card-images')
            .upload(backExactFileName, backExactBuffer, {
              contentType: 'image/webp',
              upsert: true
            })
          
          if (!backExactError) {
            const { data: backExactUrl } = supabase.storage
              .from('card-images')
              .getPublicUrl(backExactFileName)
            overlayUrls.back_exact_overlay_url = backExactUrl.publicUrl
          }
        }
      }

      console.log('Overlay images processed:', overlayUrls)
    } catch (overlayError) {
      console.error('Error downloading overlay images:', overlayError)
      // Continue without overlay images - this is not a critical error
    }

    // Store complete response with our metadata
    const gradingDetails = {
      ximilar_response: ximilarResult, // Store complete API response
      weighted_calculation: weightedCalculation,
      metadata: {
        analysis_date: new Date().toISOString(),
        api_version: 'card-grader/v2/grade',
        credit_count: 1, // This request counts as 1 credit
        processing_time: ximilarResult.statistics?.["processing time"] || null
      }
    }

    // Update card record with grading results and overlay URLs
    const { error: updateError } = await supabase
      .from('cards')
      .update({
        estimated_grade: estimatedGrade,
        confidence: confidence,
        grading_details: gradingDetails,
        front_full_overlay_url: overlayUrls.front_full_overlay_url,
        front_exact_overlay_url: overlayUrls.front_exact_overlay_url,
        back_full_overlay_url: overlayUrls.back_full_overlay_url,
        back_exact_overlay_url: overlayUrls.back_exact_overlay_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', cardId)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({ error: 'Failed to save analysis results' }, { status: 500 })
    }

    // 5. Deduct credit only after successful analysis and database update
    const { error: deductError } = await supabase.rpc('deduct_user_credit', {
      user_id: user.id
    })
    
    if (deductError) {
      console.error('Credit deduction error:', deductError)
      // Analysis was successful but credit deduction failed - log but don't fail the request
    }

    return NextResponse.json({
      success: true,
      cardId,
      estimatedGrade,
      confidence,
      gradingDetails
    })

  } catch (error) {
    console.error('Analysis error:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error during card analysis',
      success: false 
    }, { status: 500 })
  }
}
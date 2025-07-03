import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { cardId } = await request.json()

    if (!cardId) {
      return NextResponse.json({ error: 'Card ID is required' }, { status: 400 })
    }

    // Get card data
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .single()

    if (cardError || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    if (!card.front_image_url || !card.back_image_url) {
      return NextResponse.json({ error: 'Card images not found' }, { status: 400 })
    }

    // Call Ximilar API
    const ximilarResponse = await fetch('https://api.ximilar.com/recognition/v2/card-grading/detect', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.XIMILAR_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [
          {
            _url: card.front_image_url,
            _key: 'front'
          },
          {
            _url: card.back_image_url,
            _key: 'back'
          }
        ]
      }),
    })

    if (!ximilarResponse.ok) {
      const errorText = await ximilarResponse.text()
      console.error('Ximilar API error:', errorText)
      return NextResponse.json({ 
        error: 'Failed to analyze card. Please check image quality and try again.',
        success: false 
      }, { status: 500 })
    }

    const ximilarResult = await ximilarResponse.json()
    
    // Check if analysis was successful
    if (!ximilarResult.records || ximilarResult.records.length === 0) {
      return NextResponse.json({ 
        error: 'Unable to analyze card. Please ensure images are clear and well-lit.',
        success: false 
      }, { status: 400 })
    }

    // Process Ximilar results
    let estimatedGrade = null
    let confidence = null
    let gradingDetails = {}

    // Extract grade from Ximilar response (this will depend on their actual API response format)
    const frontResult = ximilarResult.records.find((r: any) => r._key === 'front')
    const backResult = ximilarResult.records.find((r: any) => r._key === 'back')

    if (frontResult && frontResult.grade) {
      estimatedGrade = frontResult.grade
      confidence = frontResult.confidence || 0.8
      gradingDetails = {
        front: frontResult,
        back: backResult,
        analysis_date: new Date().toISOString()
      }
    } else {
      // If no grade detected, still save the analysis attempt
      gradingDetails = {
        front: frontResult,
        back: backResult,
        analysis_date: new Date().toISOString(),
        note: 'Grade could not be determined from images'
      }
    }

    // Update card record with grading results
    const { error: updateError } = await supabase
      .from('cards')
      .update({
        estimated_grade: estimatedGrade,
        confidence: confidence,
        grading_details: gradingDetails,
        updated_at: new Date().toISOString()
      })
      .eq('id', cardId)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({ error: 'Failed to save analysis results' }, { status: 500 })
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
    return NextResponse.json({ 
      error: 'Internal server error during card analysis',
      success: false 
    }, { status: 500 })
  }
}
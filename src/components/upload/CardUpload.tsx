'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, getUserCredits, deductCredit } from '@/lib/auth'

interface CardUploadProps {
  onUploadComplete: (cardId: string) => void
}

export default function CardUpload({ onUploadComplete }: CardUploadProps) {
  const [frontImage, setFrontImage] = useState<File | null>(null)
  const [backImage, setBackImage] = useState<File | null>(null)
  const [frontPreview, setFrontPreview] = useState<string | null>(null)
  const [backPreview, setBackPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadStep, setUploadStep] = useState<'upload' | 'analyze'>('upload')

  const handleFileSelect = (file: File, type: 'front' | 'back') => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('Image must be less than 10MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (type === 'front') {
        setFrontImage(file)
        setFrontPreview(result)
      } else {
        setBackImage(file)
        setBackPreview(result)
      }
    }
    reader.readAsDataURL(file)
    setError('')
  }

  const uploadImages = async () => {
    if (!frontImage || !backImage) {
      setError('Please select both front and back images')
      return null
    }

    const user = await getCurrentUser()
    if (!user) {
      setError('Please sign in to upload images')
      return null
    }

    // Create card record first
    const { data: cardData, error: cardError } = await supabase
      .from('cards')
      .insert({
        user_id: user.id,
      })
      .select()
      .single()

    if (cardError) {
      setError('Failed to create card record')
      return null
    }

    try {
      // Upload front image
      const frontFileName = `${user.id}/${cardData.id}/front.${frontImage.name.split('.').pop()}`
      const { error: frontUploadError } = await supabase.storage
        .from('card-images')
        .upload(frontFileName, frontImage)

      if (frontUploadError) throw frontUploadError

      // Upload back image
      const backFileName = `${user.id}/${cardData.id}/back.${backImage.name.split('.').pop()}`
      const { error: backUploadError } = await supabase.storage
        .from('card-images')
        .upload(backFileName, backImage)

      if (backUploadError) throw backUploadError

      // Get public URLs
      const { data: frontUrl } = supabase.storage
        .from('card-images')
        .getPublicUrl(frontFileName)

      const { data: backUrl } = supabase.storage
        .from('card-images')
        .getPublicUrl(backFileName)

      // Update card record with image URLs
      const { error: updateError } = await supabase
        .from('cards')
        .update({
          front_image_url: frontUrl.publicUrl,
          back_image_url: backUrl.publicUrl,
        })
        .eq('id', cardData.id)

      if (updateError) throw updateError

      return cardData.id
    } catch (error) {
      // Clean up card record if image upload fails
      await supabase.from('cards').delete().eq('id', cardData.id)
      throw error
    }
  }

  const analyzeCard = async (cardId: string) => {
    const user = await getCurrentUser()
    if (!user) return

    // Check credits
    const credits = await getUserCredits(user.id)
    if (credits <= 0) {
      setError('No credits remaining. Please purchase more credits to analyze cards.')
      return
    }

    try {
      // Call Ximilar API
      const response = await fetch('/api/analyze-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardId }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze card')
      }

      const result = await response.json()
      
      if (result.success) {
        // Deduct credit only on successful analysis
        await deductCredit(user.id)
        onUploadComplete(cardId)
      } else {
        setError(result.error || 'Failed to analyze card')
      }
    } catch (error) {
      setError('Failed to analyze card. Please try again.')
    }
  }

  const handleAnalyze = async () => {
    setLoading(true)
    setError('')

    try {
      // First upload images
      const cardId = await uploadImages()
      if (!cardId) return

      // Then analyze
      setUploadStep('analyze')
      await analyzeCard(cardId)
    } catch (error: any) {
      setError(error.message || 'Failed to process card')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Card Photos</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Front Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Front of Card
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            {frontPreview ? (
              <div className="space-y-2">
                <img
                  src={frontPreview}
                  alt="Front preview"
                  className="mx-auto h-32 object-contain"
                />
                <button
                  onClick={() => {
                    setFrontImage(null)
                    setFrontPreview(null)
                  }}
                  className="text-sm text-red-600 hover:text-red-500"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">Click to upload front image</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'front')}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Back Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Back of Card
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            {backPreview ? (
              <div className="space-y-2">
                <img
                  src={backPreview}
                  alt="Back preview"
                  className="mx-auto h-32 object-contain"
                />
                <button
                  onClick={() => {
                    setBackImage(null)
                    setBackPreview(null)
                  }}
                  className="text-sm text-red-600 hover:text-red-500"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">Click to upload back image</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'back')}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={handleAnalyze}
          disabled={!frontImage || !backImage || loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {uploadStep === 'upload' ? 'Uploading...' : 'Analyzing...'}
            </div>
          ) : (
            'Analyze Card'
          )}
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>💡 <strong>Tips for best results:</strong></p>
        <ul className="mt-1 list-disc list-inside space-y-1">
          <li>Use good lighting with no shadows</li>
          <li>Place card on a clean, contrasting background</li>
          <li>Ensure the entire card is visible</li>
          <li>Avoid glare and reflections</li>
        </ul>
      </div>
    </div>
  )
}
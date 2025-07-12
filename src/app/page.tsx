'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { CreditsProvider } from '@/contexts/CreditsContext'
import AuthForm from '@/components/auth/AuthForm'
import Header from '@/components/layout/Header'
import CardUpload from '@/components/upload/CardUpload'
import CardCollection from '@/components/dashboard/CardCollection'
import CardDetails from '@/components/dashboard/CardDetails'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { CardErrorBoundary } from '@/components/error/CardErrorBoundary'
import type { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<'collection' | 'upload' | 'details'>('collection')
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setUser(user)
        setLoading(false)
      })
      .catch(() => {
        // Handle authentication error silently - user will see login form
        setLoading(false)
      })
  }, [])

  const handleAuthSuccess = () => {
    getCurrentUser()
      .then(setUser)
      .catch(() => {
        // Auth success but failed to get user - let app retry on next render
      })
    // Note: CreditsProvider will automatically refresh when the user changes
  }

  const handleSignOut = () => {
    setUser(null)
  }

  const handleUploadComplete = () => {
    // Return to collection view after successful upload
    setCurrentView('collection')
  }

  const handleViewCard = (cardId: string) => {
    setSelectedCardId(cardId)
    setCurrentView('details')
  }

  const handleUploadNew = () => {
    setCurrentView('upload')
  }

  const handleBackToCollection = () => {
    setCurrentView('collection')
    setSelectedCardId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm onSuccess={handleAuthSuccess} />
  }

  return (
    <ErrorBoundary>
      <CreditsProvider>
        <div className="min-h-screen bg-grey-50">
          <ErrorBoundary>
            <Header onSignOut={handleSignOut} />
          </ErrorBoundary>
          
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {currentView === 'upload' ? (
                <CardErrorBoundary 
                  title="Upload failed"
                  message="There was an issue uploading your card. Please check your images and try again."
                  onRetry={() => setCurrentView('upload')}
                >
                  <CardUpload 
                    onUploadComplete={handleUploadComplete} 
                    onCancel={handleBackToCollection}
                  />
                </CardErrorBoundary>
              ) : currentView === 'details' && selectedCardId ? (
                <CardErrorBoundary 
                  title="Card details unavailable"
                  message="There was an issue loading the card details."
                  onRetry={() => handleViewCard(selectedCardId)}
                >
                  <CardDetails 
                    cardId={selectedCardId}
                    onBack={handleBackToCollection}
                  />
                </CardErrorBoundary>
              ) : (
                <ErrorBoundary>
                  <CardCollection 
                    onViewCard={handleViewCard}
                    onUploadNew={handleUploadNew}
                  />
                </ErrorBoundary>
              )}
            </div>
          </main>
        </div>
      </CreditsProvider>
    </ErrorBoundary>
  )
}

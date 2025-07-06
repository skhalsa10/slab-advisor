'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { CreditsProvider } from '@/contexts/CreditsContext'
import AuthForm from '@/components/auth/AuthForm'
import Header from '@/components/layout/Header'
import CardUpload from '@/components/upload/CardUpload'
import CardCollection from '@/components/dashboard/CardCollection'
import CardDetails from '@/components/dashboard/CardDetails'
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
      .catch((error) => {
        console.error('Error getting current user:', error)
        setLoading(false)
      })
  }, [])

  const handleAuthSuccess = () => {
    getCurrentUser()
      .then(setUser)
      .catch((error) => {
        console.error('Error after auth success:', error)
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
    <CreditsProvider>
      <div className="min-h-screen bg-grey-50">
        <Header onSignOut={handleSignOut} />
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {currentView === 'upload' ? (
              <CardUpload 
                onUploadComplete={handleUploadComplete} 
                onCancel={handleBackToCollection}
              />
            ) : currentView === 'details' && selectedCardId ? (
              <CardDetails 
                cardId={selectedCardId}
                onBack={handleBackToCollection}
              />
            ) : (
              <CardCollection 
                onViewCard={handleViewCard}
                onUploadNew={handleUploadNew}
              />
            )}
          </div>
        </main>
      </div>
    </CreditsProvider>
  )
}

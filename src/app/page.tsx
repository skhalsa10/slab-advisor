'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser } from '@/lib/auth'
import AuthForm from '@/components/auth/AuthForm'
import Header from '@/components/layout/Header'
import CardUpload from '@/components/upload/CardUpload'
import type { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)

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
  }

  const handleSignOut = () => {
    setUser(null)
  }

  const handleUploadComplete = (cardId: string) => {
    // For now, just show success message
    alert(`Card analyzed successfully! Card ID: ${cardId}`)
    setShowUpload(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm onSuccess={handleAuthSuccess} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSignOut={handleSignOut} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Welcome to Slab Advisor
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Upload your trading card photos to get AI-powered grade estimates
            </p>
          </div>

          <div className="mt-12">
            {showUpload ? (
              <CardUpload onUploadComplete={handleUploadComplete} />
            ) : (
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Card Analysis
                  </h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>Upload front and back photos of your trading card to get started.</p>
                  </div>
                  <div className="mt-5">
                    <button
                      onClick={() => setShowUpload(true)}
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Upload Card Photos
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

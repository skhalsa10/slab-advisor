'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  validateUsernameFormat,
  suggestUsernameFromEmail,
} from '@/utils/usernameValidation'
import LoadingScreen from '@/components/ui/LoadingScreen'

/**
 * Complete Profile Page
 *
 * After OAuth signup (Google), new users are redirected here to set their username.
 * This page is required before accessing the app.
 */
export default function CompleteProfile() {
  const router = useRouter()
  

  const [username, setUsername] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  )
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Check if user already has profile, suggest username from email
  useEffect(() => {
    async function checkProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          // Not authenticated, redirect to login
          router.push('/auth')
          return
        }

        // Check if user already has profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', user.id)
          .single()

        if (profile) {
          // Already has profile, redirect to dashboard
          router.push('/dashboard')
          return
        }

        // Suggest username from email
        if (user.email) {
          const suggested = suggestUsernameFromEmail(user.email)
          setUsername(suggested)
        }

        setLoading(false)
      } catch (err) {
        console.error('Error checking profile:', err)
        setError('Failed to load profile')
        setLoading(false)
      }
    }

    checkProfile()
  }, [router])

  // Debounced username availability check
  useEffect(() => {
    if (!username) return

    const validation = validateUsernameFormat(username)
    if (!validation.valid) {
      setUsernameError(validation.error || '')
      setUsernameAvailable(false)
      return
    }

    setUsernameError('')
    setUsernameChecking(true)

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch('/api/profile/username-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        })
        const data = await response.json()
        setUsernameAvailable(data.available)
        if (!data.available && data.error) {
          setUsernameError(data.error)
        }
      } catch (error) {
        console.error('Error checking username:', error)
      } finally {
        setUsernameChecking(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [username])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      // Create profile
      const response = await fetch('/api/profile/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to create profile')
        setSubmitting(false)
        return
      }

      // Success! Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Error creating profile:', err)
      setError('An unexpected error occurred')
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading..." />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-grey-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-3xl font-extrabold text-grey-900">
            Choose Your Username
          </h2>
          <p className="mt-2 text-sm text-grey-600">
            Pick a unique username to complete your profile
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-grey-700"
            >
              Username
            </label>
            <div className="mt-1 relative">
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 pr-10 border border-grey-300 placeholder-grey-500 text-grey-900 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="your_username"
              />
              {/* Validation indicators */}
              {username && (
                <div className="absolute right-3 top-2">
                  {usernameChecking ? (
                    <svg
                      className="animate-spin h-5 w-5 text-grey-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : usernameAvailable ? (
                    <svg
                      className="h-5 w-5 text-green-600"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-red-600"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              )}
            </div>
            {usernameError && (
              <p className="mt-2 text-sm text-red-600">{usernameError}</p>
            )}
            {/* Show lowercase preview if username contains uppercase */}
            {username && username !== username.toLowerCase() && (
              <p className="mt-1 text-xs text-grey-600">
                Will be saved as: <strong>{username.toLowerCase()}</strong>
              </p>
            )}
            <p className="mt-2 text-xs text-grey-500">
              3-30 characters, letters, numbers, and underscores only
            </p>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting || !usernameAvailable || usernameChecking}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
          >
            {submitting ? 'Creating Profile...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

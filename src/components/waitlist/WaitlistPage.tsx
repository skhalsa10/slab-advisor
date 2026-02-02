'use client'

import { useState, type FormEvent } from 'react'
import WaitlistNavbar from './WaitlistNavbar'

/**
 * WaitlistPage Component
 *
 * Pre-launch landing page that collects email signups for the waitlist.
 * Simple, focused design: headline, brief value proposition, and email form.
 * No app functionality is exposed — just email capture.
 */

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    setErrorMessage('')

    try {
      const response = await fetch('/api/waitlist/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.error || 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }

      setStatus('success')
    } catch {
      setErrorMessage('Network error. Please check your connection and try again.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <WaitlistNavbar />

      <main className="flex-1 bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl w-full text-center py-20">
          {status === 'success' ? (
            <div className="animate-fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-grey-900 mb-4">
                You&apos;re on the list!
              </h2>
              <p className="text-lg text-grey-600">
                We&apos;ll notify you when Slab Advisor is ready. Check your inbox for a welcome message.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-4xl sm:text-5xl font-bold text-grey-900 mb-6">
                The Sanctuary for
                <span className="text-orange-600 block">Card Collectors</span>
              </h1>

              <p className="text-lg sm:text-xl text-grey-600 mb-10 max-w-lg mx-auto">
                AI-powered card grading, real-time pricing, and professional portfolio tracking
                for your TCG and sports cards. Be the first to get access.
              </p>

              <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <label htmlFor="waitlist-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="waitlist-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={status === 'submitting'}
                    className="flex-1 px-4 py-3 rounded-lg border border-grey-300 text-grey-900 placeholder-grey-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 text-base"
                  />
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-base whitespace-nowrap"
                  >
                    {status === 'submitting' ? 'Joining...' : 'Join Waitlist'}
                  </button>
                </div>

                {status === 'error' && (
                  <p className="mt-3 text-sm text-red-600" role="alert">
                    {errorMessage}
                  </p>
                )}
              </form>

              <p className="mt-6 text-sm text-grey-500">
                Join early and be a founding member. No spam, ever.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

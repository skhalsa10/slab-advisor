'use client'

import ErrorState from '@/components/ui/ErrorState'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ reset }: ErrorProps) {
  return (
    <ErrorState
      message="Failed to load Pokemon sets. Please try again later."
      onRetry={reset}
    />
  )
}

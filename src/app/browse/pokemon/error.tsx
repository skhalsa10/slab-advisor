'use client'

import AppNavigation from '@/components/layout/AppNavigation'
import ErrorState from '@/components/ui/ErrorState'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ reset }: ErrorProps) {
  return (
    <AppNavigation>
      <ErrorState 
        message="Failed to load Pokemon sets. Please try again later."
        onRetry={reset}
      />
    </AppNavigation>
  )
}
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
        title="Error Loading Set"
        message="Failed to load set details. Please try again later."
        onRetry={reset}
      />
    </AppNavigation>
  )
}
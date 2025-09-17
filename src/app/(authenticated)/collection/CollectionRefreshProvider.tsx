'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuickAddContext } from '@/contexts/QuickAddContext'

interface CollectionRefreshProviderProps {
  children: React.ReactNode
}

/**
 * CollectionRefreshProvider Component
 * 
 * Provides router.refresh() functionality to the QuickAdd context 
 * to trigger server component re-renders when cards are added to the collection.
 * This maintains the secure server-side data fetching while enabling 
 * immediate UI updates after QuickAdd operations.
 */
export default function CollectionRefreshProvider({ children }: CollectionRefreshProviderProps) {
  const router = useRouter()
  const { setCollectionUpdateCallback } = useQuickAddContext()

  useEffect(() => {
    // Set the refresh callback when component mounts
    const refreshCallback = () => {
      router.refresh()
    }

    setCollectionUpdateCallback(refreshCallback)

    // Clean up when component unmounts
    return () => {
      setCollectionUpdateCallback(undefined)
    }
  }, [router, setCollectionUpdateCallback])

  return <>{children}</>
}
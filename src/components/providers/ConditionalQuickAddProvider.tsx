'use client'

import { useAuth } from '@/hooks/useAuth'
import { QuickAddProvider } from '@/contexts/QuickAddContext'

interface ConditionalQuickAddProviderProps {
  children: React.ReactNode
}

/**
 * ConditionalQuickAddProvider Component
 * 
 * Conditionally provides QuickAdd context based on user authentication status.
 * Only authenticated users get access to the QuickAdd functionality.
 * 
 * This component should be placed at the root level to ensure all pages
 * have consistent access to QuickAdd when authenticated.
 */
export default function ConditionalQuickAddProvider({ children }: ConditionalQuickAddProviderProps) {
  const { user } = useAuth()
  
  // Only provide QuickAdd context for authenticated users
  if (user) {
    return <QuickAddProvider>{children}</QuickAddProvider>
  }
  
  // No provider for unauthenticated users - they won't have access to QuickAdd
  return <>{children}</>
}
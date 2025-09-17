'use client'

import { QuickAddProvider } from '@/contexts/QuickAddContext'

interface ConditionalQuickAddProviderProps {
  children: React.ReactNode
}

/**
 * ConditionalQuickAddProvider Component
 * 
 * Provides QuickAdd context globally following React best practices.
 * Context is always available to prevent hook errors, but individual
 * features are conditionally controlled based on authentication state.
 * 
 * This component should be placed at the root level to ensure all pages
 * have consistent access to QuickAdd context.
 */
export default function ConditionalQuickAddProvider({ children }: ConditionalQuickAddProviderProps) {
  // Always provide QuickAdd context to avoid hook errors during auth loading
  // Individual components will conditionally show/enable QuickAdd features based on auth state
  return <QuickAddProvider>{children}</QuickAddProvider>
}
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { signOut } from '@/lib/auth'
import type { User } from '@supabase/supabase-js'

/**
 * Navigates to the auth page with appropriate redirect handling
 * 
 * @param router - Next.js router instance
 * @param currentPath - Optional current path, defaults to window.location.pathname
 * 
 * @example
 * ```typescript
 * // In a component
 * const router = useRouter()
 * const handleLogin = () => navigateToAuth(router)
 * ```
 */
export function navigateToAuth(router: AppRouterInstance, currentPath?: string): void {
  // Get current path, either from parameter or window location
  const path = currentPath || window.location.pathname
  
  // Determine where to redirect after login
  const redirectTo = path === '/' ? '/dashboard' : path
  
  // Navigate to auth page with redirect parameter
  router.push(`/auth?redirect=${encodeURIComponent(redirectTo)}`)
}

/**
 * Hook-like function that returns a login handler
 * Useful for components that need a login callback
 * 
 * @param router - Next.js router instance
 * @returns Login handler function
 * 
 * @example
 * ```typescript
 * const router = useRouter()
 * const handleLogin = createLoginHandler(router)
 * ```
 */
export function createLoginHandler(router: AppRouterInstance): () => void {
  return () => navigateToAuth(router)
}

/**
 * Handles complete sign out process
 * - Calls Supabase signOut to clear session
 * - Clears local user state
 * - Redirects to home page
 * 
 * @param router - Next.js router instance
 * @param setUser - User state setter function
 * 
 * @example
 * ```typescript
 * const router = useRouter()
 * const [user, setUser] = useState<User | null>(null)
 * const handleSignOut = () => handleSignOutProcess(router, setUser)
 * ```
 */
export async function handleSignOutProcess(
  router: AppRouterInstance, 
  setUser: (user: User | null) => void
): Promise<void> {
  try {
    // Sign out from Supabase (clears session)
    await signOut()
  } catch (error) {
    console.error('Sign out error:', error)
    // Continue with local cleanup even if server signout fails
  } finally {
    // Clear local user state
    setUser(null)
    // Redirect to home page
    router.push('/')
  }
}

/**
 * Creates a sign out handler function
 * Useful for components that need a sign out callback
 * 
 * @param router - Next.js router instance
 * @param setUser - User state setter function
 * @returns Sign out handler function
 * 
 * @example
 * ```typescript
 * const router = useRouter()
 * const [user, setUser] = useState<User | null>(null)
 * const handleSignOut = createSignOutHandler(router, setUser)
 * ```
 */
export function createSignOutHandler(
  router: AppRouterInstance, 
  setUser: (user: User | null) => void
): () => void {
  return () => handleSignOutProcess(router, setUser)
}
import { SpeedInsights } from '@vercel/speed-insights/next'
import { getUser } from '@/lib/auth-server'
import { fetchUserTheme } from '@/actions/settings'
import { AuthStateProvider } from '@/contexts/AuthStateContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import ConditionalQuickAddProvider from '@/components/providers/ConditionalQuickAddProvider'
import EnvironmentBadge from '@/components/ui/EnvironmentBadge'
import CookieConsent from '@/components/consent/CookieConsent'

/**
 * Server component that fetches per-user data (auth + theme) and provides
 * the app's context providers. Rendered inside a <Suspense> boundary in the
 * root layout so that cookies() calls don't block static prerendering.
 */
export default async function LayoutProviders({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  const initialTheme = await fetchUserTheme()

  return (
    <ThemeProvider initialTheme={initialTheme}>
      <AuthStateProvider initialUser={user}>
        <ConditionalQuickAddProvider>
          {children}
        </ConditionalQuickAddProvider>
      </AuthStateProvider>
      <EnvironmentBadge />
      <CookieConsent />
      <SpeedInsights />
    </ThemeProvider>
  )
}

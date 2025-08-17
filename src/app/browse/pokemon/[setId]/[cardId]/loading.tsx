import LoadingScreen from '@/components/ui/LoadingScreen'
import AppNavigation from '@/components/layout/AppNavigation'

export default function Loading() {
  return (
    <AppNavigation>
      <LoadingScreen message="Loading card details..." />
    </AppNavigation>
  )
}
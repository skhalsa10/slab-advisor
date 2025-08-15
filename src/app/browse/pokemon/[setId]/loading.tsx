import AppNavigation from '@/components/layout/AppNavigation'
import LoadingScreen from '@/components/ui/LoadingScreen'

export default function Loading() {
  return (
    <AppNavigation>
      <LoadingScreen 
        fullScreen={false} 
        message="Loading set details..." 
        background="white"
      />
    </AppNavigation>
  )
}
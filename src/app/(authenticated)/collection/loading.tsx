import LoadingScreen from '@/components/ui/LoadingScreen'

/**
 * Collection Loading Component
 * 
 * Displays a loading state while collection data is being fetched server-side.
 * This component is shown automatically by Next.js during server-side data fetching.
 */
export default function CollectionLoading() {
  return <LoadingScreen fullScreen={false} background="white" />
}
import LoadingScreen from '@/components/ui/LoadingScreen'

export default function Loading() {
  return (
    <LoadingScreen
      fullScreen={false}
      message="Loading set details..."
      background="white"
    />
  )
}

import LoadingSpinner from './LoadingSpinner'

interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
  background?: 'grey' | 'white' | 'transparent'
}

/**
 * Full-screen or contained loading screen component
 * 
 * @param message - Optional loading message to display
 * @param fullScreen - Whether to use min-h-screen (default: true)
 * @param background - Background color variant (default: 'grey')
 */
export default function LoadingScreen({ 
  message, 
  fullScreen = true, 
  background = 'grey' 
}: LoadingScreenProps) {
  const backgroundClasses = {
    grey: 'bg-grey-50',
    white: 'bg-white',
    transparent: 'bg-transparent'
  }

  const heightClass = fullScreen ? 'min-h-screen' : 'py-12'

  return (
    <div className={`${heightClass} flex items-center justify-center ${backgroundClasses[background]}`}>
      <div className="text-center">
        <LoadingSpinner className="mx-auto" />
        {message && (
          <p className="mt-4 text-grey-600">{message}</p>
        )}
      </div>
    </div>
  )
}
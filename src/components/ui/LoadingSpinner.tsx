interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Reusable loading spinner component
 * 
 * @param size - Size of the spinner: 'sm' (4x4), 'md' (6x6), 'lg' (8x8)
 * @param className - Additional CSS classes
 */
export default function LoadingSpinner({ size = 'lg', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  }

  return (
    <div 
      className={`animate-spin rounded-full border-b-2 border-orange-600 ${sizeClasses[size]} ${className}`}
      aria-label="Loading..."
      role="status"
    />
  )
}
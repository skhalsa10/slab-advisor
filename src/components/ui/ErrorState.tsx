interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  retryText?: string
}

export default function ErrorState({ 
  title = "Error Loading Data",
  message, 
  onRetry,
  retryText = "Try Again"
}: ErrorStateProps) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-grey-900 mb-2">{title}</h3>
      <p className="text-sm text-grey-600 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
        >
          {retryText}
        </button>
      )}
    </div>
  )
}
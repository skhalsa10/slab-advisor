'use client'

export default function EmptyCollectionState() {
  return (
    <div className="text-center py-12">
      <svg 
        className="mx-auto h-12 w-12 text-grey-400" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
        />
      </svg>
      
      <h3 className="mt-2 text-sm font-medium text-grey-900">No cards yet</h3>
      <p className="mt-1 text-sm text-grey-500">
        Your collection is empty. Cards will appear here once added.
      </p>
    </div>
  )
}
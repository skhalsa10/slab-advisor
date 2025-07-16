'use client'

import Link from 'next/link'

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
        Get started by uploading your first card for AI-powered grading and identification.
      </p>
      
      <div className="mt-6">
        <Link
          href="/collection/upload"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload First Card
        </Link>
      </div>
      
      {/* Tips section */}
      <div className="mt-8 max-w-md mx-auto">
        <div className="bg-orange-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-orange-800 mb-2">💡 Tips for best results:</h4>
          <ul className="text-sm text-orange-700 space-y-1 text-left">
            <li>• Use good lighting with no shadows</li>
            <li>• Ensure the entire card is visible</li>
            <li>• Place card on a clean background</li>
            <li>• Use high resolution images</li>
          </ul>
        </div>
      </div>
    </div>
  )
}